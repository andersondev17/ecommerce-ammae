// src/app/api/mercadopago/route.ts
import { createOrder } from "@/lib/actions/order";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema/payments";
import { mercadopago } from "@/lib/payments/mercadopagoClient";
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
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('MP Webhook received:', JSON.stringify(body, null, 2));

        const paymentId = body?.data?.id;
        if (!paymentId) {
            console.error('No payment ID in webhook');
            return new Response("No id", { status: 400 });
        }

        // Obtener pago desde SDK
        const paymentResponse = await new Payment(mercadopago).get({ id: paymentId });
        const payment = (paymentResponse as MercadoPagoPaymentResponse).body ?? paymentResponse;

        console.log('Payment data:', {
            id: payment.id,
            status: payment.status,
            external_reference: payment.external_reference,
            metadata: payment.metadata
        });

        // Idempotencia
        const existing = await db.select().from(payments).where(eq(payments.transactionId, String(payment.id))).limit(1);
        if (existing.length && existing[0].status === "completed") {
            console.log('Payment already processed');
            return new Response(null, { status: 200 });
        }

        // ✅ FIX: Buscar orderId en metadata.cartId (que es nuestro orderId real)
        const externalOrderId = payment.external_reference ?? payment.metadata?.cartId;
        if (!externalOrderId) {
            console.error('No external reference or cartId found');
            return new Response("no external reference", { status: 400 });
        }

        console.log('Processing order:', externalOrderId);

        if (payment.status === "approved" || payment.status === "paid") {
            await createOrder({
                orderId: externalOrderId,
                paymentMethod: "mercadopago",
                status: "paid",
                transactionId: String(payment.id),
                paidAt: new Date(),
            });
            console.log(`Order ${externalOrderId} marked as paid`);
        } else if (payment.status === "pending") {
            await db.update(payments).set({ status: "initiated" }).where(eq(payments.orderId, externalOrderId));
            console.log(`Order ${externalOrderId} marked as pending`);
        } else {
            await db.update(payments).set({ status: "failed" }).where(eq(payments.orderId, externalOrderId));
            console.log(`Order ${externalOrderId} marked as failed`);
        }

        return new Response(null, { status: 200 });
    } catch (err) {
        console.error("MP webhook error:", err);
        return new Response(String(err), { status: 500 });
    }
}