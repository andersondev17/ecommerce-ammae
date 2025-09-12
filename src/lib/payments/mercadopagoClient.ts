// src/lib/payments/mercadopagoClient.ts - CONSERVATIVE VERSION
import { MercadoPagoConfig, Preference } from "mercadopago";

export const mercadopago = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function createMercadoPagoPreference(params: {
    cartId: string;
    userId?: string;
    amount: number;
    items: Array<{
        name: string;
        price: number;
        quantity: number;
    }>;
}) {
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
            external_reference: params.cartId,
        },
    });

    return response.init_point!;
}