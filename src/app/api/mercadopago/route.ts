import { db } from "@/lib/db";
import { orderItems, orders, payments, productVariants } from "@/lib/db/schema";
import { mercadopago } from "@/lib/payments/mercadopagoClient";
import { PaymentResponse } from "@/types/payments/types";
import { createHmac, timingSafeEqual } from "crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { Payment } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

type MPPayment = PaymentResponse;

interface WebhookPayload {
    action: string;
    data: { id: string };
    type: string;
}
interface MPPaymentGetResponse {
    id?: string | number;
    status?: string;
    external_reference?: string;
    transaction_amount?: number;
    currency_id?: string;
    metadata?: {
        cartId?: string;
        orderId?: string;
        userId?: string;
        items?: string;
        integration_type?: string;
        platform?: string;
        created_at?: string;
    };
    payer?: {
        id?: string;
        email?: string;
    };
}
const STATUS_MAP: Record<string, 'paid' | 'pending' | 'failed'> = {
    'approved': 'paid',
    'authorized': 'paid',
    'pending': 'pending',
    'in_process': 'pending',
    'in_mediation': 'pending',
    'rejected': 'failed',
    'cancelled': 'failed',
    'refunded': 'failed',
    'charged_back': 'failed'
};

function validateMPSignature(dataId: string, xRequestId: string, xSignature: string, secret: string): boolean {
    try {
        const parts = xSignature.split(',');
        const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
        const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];

        if (!ts || !hash) {
            console.warn('[MP Webhook] Missing signature components');
            return false;
        }

        // Build manifest according to MP official docs
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        // Compute HMAC-SHA256
        const expectedHash = createHmac('sha256', secret.trim()).update(manifest).digest('hex');

        const signatureBuffer = Buffer.from(hash, 'hex');
        const expectedBuffer = Buffer.from(expectedHash, 'hex');

        return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

async function fetchPaymentDetails(paymentId: string): Promise<MPPayment | null> {
    try {
        const response = await new Payment(mercadopago).get({ id: paymentId }) as unknown as MPPaymentGetResponse;
        
        if (!response?.id || !response?.status) {
            console.error('[MP] Invalid payment response structure:', { paymentId, hasId: !!response?.id, hasStatus: !!response?.status });
            return null;
        }

        return {
            id: response.id,
            status: response.status,
            external_reference: response.external_reference,
            transaction_amount: response.transaction_amount,
            currency_id: response.currency_id,
            metadata: response.metadata,
            payer: response.payer
        };
    } catch (error) {
        console.error('[MP] Error fetching payment:', error);
        return null;
    }
}

async function processPayment(orderId: string, paymentId: string, status: 'paid' | 'pending' | 'failed'): Promise<void> {
    const statusConfig = {
        paid: { payment: { status: "completed" as const, transactionId: paymentId, paidAt: new Date() }, order: "paid" as const },
        pending: { payment: { status: "initiated" as const, transactionId: paymentId }, order: "pending" as const },
        failed: { payment: { status: "failed" as const, transactionId: paymentId }, order: "cancelled" as const }
    };

    const config = statusConfig[status];

    await db.transaction(async (tx) => {
        const [currentOrder] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).for('update');
        if (!currentOrder) throw new Error('Order not found');

        // Idempotency: Check if payment exists, create or update accordingly
        const [existingPayment] = await tx.select()
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .limit(1);

        if (!existingPayment) {
            await tx.insert(payments).values({
                orderId,
                method: "mercadopago",
                ...config.payment
            });
        } else {
            // Update existing payment (second webhook may have updated status)
            await tx.update(payments)
                .set(config.payment)
                .where(eq(payments.orderId, orderId));
        }

        // CRITICAL: This ALWAYS executes, even on duplicate webhooks
        await tx.update(orders).set({ status: config.order }).where(eq(orders.id, orderId));
        console.log(`[MP Webhook] Order ${orderId} updated to status: ${config.order}`);

        if (status === 'paid' && currentOrder.status !== 'paid') {
            const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

            if (items.length === 0) return;

            // Batch: Lock todos los variants de una vez
            const variantIds = items.map(i => i.productVariantId);
            const variants = await tx.select()
                .from(productVariants)
                .where(inArray(productVariants.id, variantIds))
                .for('update');

            // Validar stock en memoria (no DB calls)
            const stockMap = new Map(variants.map(v => [v.id, v.inStock]));
            for (const item of items) {
                const stock = stockMap.get(item.productVariantId);
                if (!stock || stock < item.quantity) {
                    throw new Error(`Insufficient stock: ${item.productVariantId}`);
                }
            }

            // Batch: Update todos los variants (SQL optimizado)
            for (const item of items) {
                await tx.update(productVariants)
                    .set({ inStock: sql`${productVariants.inStock} - ${item.quantity}` })
                    .where(eq(productVariants.id, item.productVariantId));
            }
            console.log(`[MP Webhook] Stock decreased for order ${orderId} (${items.length} items)`);
        }

        if (status === 'failed' && currentOrder.status === 'paid') {
            const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

            if (items.length === 0) return;

            // Batch: Update todos los variants para rollback de stock
            for (const item of items) {
                await tx.update(productVariants)
                    .set({ inStock: sql`${productVariants.inStock} + ${item.quantity}` })
                    .where(eq(productVariants.id, item.productVariantId));
            }
        }
    });
}


export async function POST(req: NextRequest) {
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const dataId = url.searchParams.get('data.id');

    if (type !== 'payment') return new Response('received', { status: 200 });

    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret || !xSignature || !xRequestId || !dataId) {
        return new Response(!secret ? 'Server error' : 'Bad request', { status: !secret ? 500 : 400 });
    }
    if (!validateMPSignature(dataId, xRequestId, xSignature, secret)) {
        console.error('[MP] Invalid signature:', dataId);
        return new Response('Unauthorized', { status: 401 });
    }
    try {
        //  Parse body
        const body = await req.json() as WebhookPayload;
        const paymentId = body?.data?.id;
        if (!paymentId || paymentId !== dataId) {
            return new Response('Invalid payload', { status: 400 });
        }

        const payment = await fetchPaymentDetails(paymentId);
        if (!payment) {
            return NextResponse.json({ received: false, error: 'Payment not found' }, { status: 200 });
        }

        const orderId = payment.external_reference ?? payment.metadata?.orderId ?? payment.metadata?.cartId;
        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ received: false, error: 'Missing order reference' }, { status: 200 });
        }

        const mappedStatus = STATUS_MAP[payment.status || ''] || 'failed';
        await processPayment(orderId, paymentId, mappedStatus);

        return NextResponse.json({ received: true, payment_id: paymentId, order_id: orderId, status: mappedStatus }, { status: 200 });

    } catch (error) {
        console.error('[MP Webhook] Processing error:', error);
        return NextResponse.json(
            // Return 200 to prevent MP retries on our internal errors
            { received: false, error: 'Internal error' },
            { status: 200 }
        );
    }
}