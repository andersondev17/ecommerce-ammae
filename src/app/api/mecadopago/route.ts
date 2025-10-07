import { createOrder } from "@/lib/actions/order";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema/payments";
import { mercadopago } from "@/lib/payments/mercadopagoClient";
import { createHmac, timingSafeEqual } from "crypto";
import { and, eq, or } from "drizzle-orm";
import { Payment } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

interface WebhookPayload {
    action: string;
    data: { id: string };
    type: string;
}

interface MPPayment {
    id: string;
    status: string;
    external_reference?: string;
    metadata?: Record<string, unknown>;
}

const STATUS_MAP: Record<string, string> = {
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

function validateMPSignature(params: {
    dataId: string;
    xRequestId: string;
    xSignature: string;
    secret: string;
}): boolean {
    const { dataId, xRequestId, xSignature, secret } = params;

    try {
        // Parse signature: "ts=1742505638683,v1=hash..."
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
        const expectedHash = createHmac('sha256', secret).update(manifest).digest('hex');

        const signatureBuffer = Buffer.from(hash, 'hex');
        const expectedBuffer = Buffer.from(expectedHash, 'hex');

        if (signatureBuffer.length !== expectedBuffer.length) {
            console.error('[MP Webhook] Signature length mismatch');
            return false;
        }
        // Timing-safe comparison
        return timingSafeEqual(signatureBuffer, expectedBuffer);

    } catch (error) {
        console.error('[MP Webhook] Signature validation error:', error);
        return false;
    }
}

async function fetchPaymentDetails(paymentId: string): Promise<MPPayment | null> {
    try {
        const response = await new Payment(mercadopago).get({ id: paymentId });

        // El SDK puede retornar en .body o directamente
        const payment = (response as any).body || response;

        if (!payment.id || !payment.status) {
            console.error('[MP Webhook] Invalid payment structure:', payment);
            return null;
        }

        return payment as MPPayment;

    } catch (error) {
        console.error('[MP Webhook] Error fetching payment:', error);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const dataId = url.searchParams.get('data.id');

    // Skip non-payment notifications
    if (type !== 'payment') {
        console.log(`[MP Webhook] Skipping ${type} notification`);
        return new Response('received', { status: 200 });
    }

    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
        console.error('[MP Webhook] MP_WEBHOOK_SECRET not configured');
        return new Response('Server misconfiguration', { status: 200 });
    }

    if (!xSignature || !xRequestId || !dataId) {
        console.error('[MP Webhook] Missing required headers/params');
        return new Response('Bad Request', { status: 200 });
    }

    // Validate x signature
    const isValid = validateMPSignature({
        dataId,
        xRequestId,
        xSignature,
        secret
    });
    if (!isValid) {
        console.error(`[MP Webhook] Invalid signature for payment: ${dataId}`);
        return new Response('Unauthorized', { status: 401 });
    }

    console.log(`[MP Webhook] ✅ Signature validated for payment: ${dataId}`);

    try {
        //  Parse body
        const body = await req.json() as WebhookPayload;
        const paymentId = body?.data?.id;
        if (!paymentId || paymentId !== dataId) {
            console.error('[MP Webhook] Payment ID mismatch');
            return new Response('Invalid payload', { status: 200 });
        }

        // Check if already processed
        const existingPayment = await db
            .select({ status: payments.status })
            .from(payments)
            .where(
                and(
                    eq(payments.transactionId, paymentId),
                    or(
                        eq(payments.status, "completed"),
                        eq(payments.status, "failed")
                    )
                )
            )
            .limit(1);

        if (existingPayment.length) {
            console.log(`[MP Webhook] Payment ${paymentId} already processed (${existingPayment[0].status})`);
            return NextResponse.json(
                { received: true, already_processed: true },
                { status: 200 }
            );
        }

        // Fetch payment details
        const paymentDetails = await fetchPaymentDetails(paymentId);
        if (!paymentDetails) {
            return NextResponse.json(
                { received: false, error: 'Payment not found' },
                { status: 200 }
            );
        }

        const orderId = paymentDetails.external_reference ?? paymentDetails.metadata?.cartId;
        if (!orderId || typeof orderId !== 'string') {
            console.error('[MP Webhook] Missing order reference in payment');
            return NextResponse.json(
                { received: false, error: 'Missing order reference' },
                { status: 200 }
            );
        }

        const mappedStatus = STATUS_MAP[paymentDetails.status] || 'failed';

        // Process payment
        if (mappedStatus === 'paid') {
            await createOrder({
                orderId,
                paymentMethod: "mercadopago",
                status: "paid",
                transactionId: paymentDetails.id,
                paidAt: new Date(),
            });
            console.log(`[MP Webhook] ✅ Order ${orderId} PAID (${Date.now() - startTime}ms)`);

        } else if (mappedStatus === 'pending') {
            await db
                .update(payments)
                .set({ status: "initiated" })
                .where(eq(payments.orderId, orderId));
            console.log(`[MP Webhook] ⏳ Order ${orderId} PENDING (${Date.now() - startTime}ms)`);

        } else {
            await db
                .update(payments)
                .set({ status: "failed" })
                .where(eq(payments.orderId, orderId));
            console.log(`[MP Webhook] ❌ Order ${orderId} FAILED: ${paymentDetails.status} (${Date.now() - startTime}ms)`);
        }

        // Return 200 OK (MP requirement to stop retries)
        return NextResponse.json(
            {
                received: true,
                payment_id: paymentId,
                status: mappedStatus,
                processing_time_ms: Date.now() - startTime
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('[MP Webhook] Processing error:', error);
        return NextResponse.json(
            // Return 200 to prevent MP retries on our internal errors
            { received: false, error: 'Internal error' },
            { status: 200 }
        );
    }
}