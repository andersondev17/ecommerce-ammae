// src/lib/payments/mercadopagoClient.ts
import { MercadoPagoConfig, Preference } from "mercadopago";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const MIN_AMOUNT_COP = 1000;

if (!MP_ACCESS_TOKEN) throw new Error('❌ MP_ACCESS_TOKEN no configurado');
if (!APP_URL) throw new Error('❌ NEXT_PUBLIC_APP_URL no configurado');

export const mercadopago = new MercadoPagoConfig({
    accessToken: MP_ACCESS_TOKEN,
    options: { timeout: 10000 }
});

interface CheckoutItem {
    name: string;
    price: number;
    quantity: number;
}

interface PreferenceParams {
    cartId: string;
    userId?: string;
    userEmail?: string;
    amount: number;
    items: CheckoutItem[];
}

export async function createMercadoPagoPreference(params: PreferenceParams): Promise<string> {
    const { cartId, userId, userEmail, amount, items } = params;

    if (amount < MIN_AMOUNT_COP) {
        throw new Error(`Monto mínimo: COP $${MIN_AMOUNT_COP}`);
    }

    const preference = new Preference(mercadopago);

    const mpItems = items.map((item, index) => ({
        id: `item-${index}`,
        title: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: "COP",
    }));

    if (mpItems.length === 0) {
        mpItems.push({
            id: "cart_checkout_summary",
            title: "Resumen de compra en AMMAE",
            quantity: 1,
            unit_price: amount,
            currency_id: "COP",
        });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
        const response = await preference.create({
            body: {
                items: mpItems,
                payer: userId && userEmail ? { email: userEmail } : undefined,
                metadata: {
                    cartId,
                    userId: userId || null,
                    items: JSON.stringify(items),
                    integration_type: "checkout_pro",
                    platform: "nextjs",
                    created_at: now.toISOString()
                },
                back_urls: {
                    success: `${APP_URL}/checkout/success`,
                    failure: `${APP_URL}/cart?error=payment_failed`,
                    pending: `${APP_URL}/checkout/success`
                },
                //auto_return: "approved",
                notification_url: `${APP_URL}/api/mercadopago`,
                external_reference: cartId,
                expires: true,
                expiration_date_from: now.toISOString(),
                expiration_date_to: expiresAt.toISOString(),
                payment_methods: {
                    excluded_payment_methods: [],// acepta todo metodo, tipo y max 12 cuotas
                    excluded_payment_types: [],
                    installments: 12,
                    default_installments: 1
                },
                statement_descriptor: "AMMAE STORE",
                additional_info: userEmail ? JSON.stringify({
                    payer: {
                        first_name: userEmail.split('@')[0],
                        email: userEmail
                    }
                }) : undefined
            },
            requestOptions: {
                idempotencyKey: cartId,
            }
        });

        if (!response.init_point) {
            throw new Error('❌ MP no retornó URL de checkout');
        }

        console.log(`✅ Preferencia MP creada: ${response.id} | Orden: ${cartId} | Monto: COP $${amount}`);

        return response.init_point;
    } catch (error) {
        // Lógica simplificada para capturar el mensaje de error, priorizando el mensaje estándar, 
        // y luego buscando la propiedad 'message' en el objeto de error (común en APIs)
        const errorMessage = error instanceof Error
            ? error.message
            : (error as { message?: string })?.message ?? 'Error desconocido en la comunicación con MP'; 

        console.error('❌ Error creando preferencia MP:', {
            cartId,
            amount,
            error: errorMessage,
            fullError: JSON.stringify(error) // Log el objeto completo para debugging
        });

        // Relanza un error estándar con el mensaje útil
        throw new Error(
            `Error al procesar pago con Mercado Pago: ${errorMessage}`
        );
    }
}

export function validateMPCredentials(): boolean {
    if (!MP_ACCESS_TOKEN) return false;

    const isProduction = MP_ACCESS_TOKEN.startsWith('APP_USR');
    const isTest = MP_ACCESS_TOKEN.startsWith('TEST');

    if (!isProduction && !isTest) {
        console.warn('⚠️ Token MP con formato inesperado');
        return false;
    }

    console.log(`✅ Credenciales MP validadas (${isProduction ? 'PRODUCCIÓN' : 'TEST'})`);
    return true;
}

validateMPCredentials();