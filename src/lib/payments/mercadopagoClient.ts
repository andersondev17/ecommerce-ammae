// src/lib/payments/mercadopagoClient.ts
import { MercadoPagoConfig, Preference } from "mercadopago";

if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no configurado');
}
export const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
    options: { timeout: 10000 }

});

export async function createMercadoPagoPreference(params: {
    cartId: string;
    userId?: string;
    userEmail?: string;
    amount: number;
    items: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
}) {
    if (params.amount < 500) {
        throw new Error('Monto mínimo: COP $500');
    }
    const preference = new Preference(mercadopago);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL is required');
    }

    const response = await preference.create({
        body: {
            items: [
                {
                    id: "cart_checkout",
                    title: "Compra en AMMAE",
                    quantity: 1,
                    unit_price: params.amount,
                    currency_id: "COP",
                }
            ],
            payer: params.userId ? {
                email: params.userEmail
            } : undefined,
            metadata: {
                cartId: params.cartId,
                userId: params.userId || null,
                items: JSON.stringify(params.items),
            },
            back_urls: {
                success: `${baseUrl}/checkout/success`,
                failure: `${baseUrl}/cart?error=payment_failed`,
                pending: `${baseUrl}/checkout/success`
            },
            // auto_return: "approved",
            notification_url: `${baseUrl}/api/mercadopago`,
            expires: true,
            external_reference: params.cartId,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

        },
    });

    return response.init_point!;
}