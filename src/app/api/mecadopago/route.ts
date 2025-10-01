import { createOrder } from "@/lib/actions/order";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema/payments";
import { mercadopago } from "@/lib/payments/mercadopagoClient";
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { Payment } from "mercadopago";
import { NextRequest } from "next/server";

interface MercadoPagoPaymentResponse {
    body?: MercadoPagoPayment;
    id?: string;
    status?: string;
    external_reference?: string;
    metadata?: Record<string, string | number | boolean>;
}

interface MercadoPagoPayment {
    id: string;
    status: string;
    external_reference?: string;
    metadata?: Record<string, string | number | boolean>;
}

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
            console.error('Invalid x-signature format');
            return false;
        }

        // Build manifest according to MP official docs
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

        // Compute HMAC-SHA256
        const expectedHash = createHmac('sha256', secret)
            .update(manifest)
            .digest('hex');

        // Timing-safe comparison
        return timingSafeEqual(
            Buffer.from(hash),
            Buffer.from(expectedHash)
        );
    } catch (error) {
        console.error('Signature validation error:', error);
        return false;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Extract and validate webhook authentication
        const xSignature = req.headers.get('x-signature');
        const xRequestId = req.headers.get('x-request-id');
        const dataId = new URL(req.url).searchParams.get('data.id');

        const secret = process.env.MP_WEBHOOK_SECRET;

        if (!secret) {
            console.error('MP_WEBHOOK_SECRET not configured');
            return new Response('Server misconfiguration', { status: 500 });
        }

        if (!xSignature || !xRequestId || !dataId) {
            console.error('Missing required webhook parameters:', {
                hasSignature: !!xSignature,
                hasRequestId: !!xRequestId,
                hasDataId: !!dataId
            });
            return new Response('Bad Request', { status: 400 });
        }

        // Validate x signature
        const isValid = validateMPSignature({
            dataId,
            xRequestId,
            xSignature,
            secret
        });

        if (!isValid) {
            console.error('❌ Invalid webhook signature - possible attack attempt');
            return new Response('Unauthorized', { status: 401 });
        }

        console.log('✅ Webhook signature validated');

        //  Parse body
        const body = await req.json();
        console.log('MP Webhook received:', JSON.stringify(body, null, 2));

        const paymentId = body?.data?.id;
        if (!paymentId) {
            console.error('No payment ID in webhook body');
            return new Response('Invalid payload', { status: 400 });
        }

        // Fetch payment details from Mercado Pago API
        const paymentResponse = await new Payment(mercadopago).get({ id: paymentId });
        const payment = (paymentResponse as MercadoPagoPaymentResponse).body ?? paymentResponse;

        console.log('Payment details:', {
            id: payment.id,
            status: payment.status,
            external_reference: payment.external_reference,
            metadata: payment.metadata
        });

        //  Idempotency check (prevent duplicate processing)
        const existing = await db
            .select()
            .from(payments)
            .where(eq(payments.transactionId, String(payment.id)))
            .limit(1);

        if (existing.length && existing[0].status === "completed") {
            console.log('⏭️  Payment already processed (idempotent)');
            return new Response(null, { status: 200 });
        }

        //  Extract orderId from external_reference or metadata
        const externalOrderId = payment.external_reference ?? payment.metadata?.cartId;
        if (!externalOrderId) {
            console.error('No order reference found in payment');
            return new Response('Invalid payment data', { status: 400 });
        }

        console.log('Processing order:', externalOrderId);

        // Process payment based on status
        if (payment.status === "approved" || payment.status === "paid") {
            await createOrder({
                orderId: String(externalOrderId),
                paymentMethod: "mercadopago",
                status: "paid",
                transactionId: String(payment.id),
                paidAt: new Date(),
            });
            console.log(`✅ Order ${externalOrderId} marked as PAID`);
        } else if (payment.status === "pending") {
            await db
                .update(payments)
                .set({ status: "initiated" })
                .where(eq(payments.orderId, String(externalOrderId)));
            console.log(`⏳ Order ${externalOrderId} marked as PENDING`);
        } else {
            await db
                .update(payments)
                .set({ status: "failed" })
                .where(eq(payments.orderId, String(externalOrderId)));
            console.log(`❌ Order ${externalOrderId} marked as FAILED (status: ${payment.status})`);
        }

        // Return 200 OK (MP requirement to stop retries)
        return new Response(null, { status: 200 });

    } catch (err) {
        console.error("❌ MP webhook processing error:", err);
        // Return 200 to prevent MP retries on our internal errors
        // (they will retry indefinitely on 5xx responses)
        return new Response(null, { status: 200 });
    }
}