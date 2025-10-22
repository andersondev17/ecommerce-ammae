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
    category_id?: string;
    description?: string;
    picture_url?: string;
}

interface PreferenceParams {
    cartId: string;
    userId?: string;
    userEmail?: string; //  para permitir usuarios invitados
    amount: number;
    items: CheckoutItem[];
    // Campos opcionales
    firstName?: string;
    lastName?: string;
    address?: {
        street_name?: string;
        street_number?: string;
        zip_code?: string;
    };
    shippingCost?: number;
}

export async function createMercadoPagoPreference(params: PreferenceParams): Promise<{ initPoint: string; preferenceId: string }> {
    const {
        cartId,
        userId,
        userEmail,
        amount,
        items,
        firstName,
        lastName,
        address,
        shippingCost
    } = params;

    if (amount < MIN_AMOUNT_COP) {
        throw new Error(`Monto mínimo: COP $${MIN_AMOUNT_COP}`);
    }
    if (!items || items.length === 0) {
        throw new Error('No hay productos en el carrito');
    }
    for (const item of items) {
        if (isNaN(item.price) || item.price <= 0) {
            throw new Error(`Precio inválido para: ${item.name}`);
        }
        if (item.quantity <= 0) {
            throw new Error(`Cantidad inválida para: ${item.name}`);
        }
    }
    const preference = new Preference(mercadopago);

    const mpItems = items.map((item, index) => {
        const unitPrice = Math.round(item.price);
        const title = item.name.replace(/\s+/g, ' ').trim().slice(0, 100);
        return {
            id: `item-${index}`,
            title,
            quantity: item.quantity,
            unit_price: unitPrice,
            currency_id: "COP",
            category_id: item.category_id || "others",
            ...(item.description && { description: item.description.slice(0, 256) }),
            ...(item.picture_url && { picture_url: item.picture_url }),
        };
    });

    if (mpItems.length === 0) {
        mpItems.push({
            id: "cart_checkout_summary",
            title: "Resumen de compra en AMMAE",
            quantity: 1,
            unit_price: amount,
            currency_id: "COP",
            category_id: "others",
        });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log('🚀 Creating MP preference:', {
        itemsCount: mpItems.length,
        totalAmount: amount,
        userEmail,
        hasPayer: !!userEmail,
        environment: process.env.NODE_ENV
    });
    try {
        const response = await preference.create({
            body: {
                items: mpItems,
                // Payer con campos opcionales
                payer: {
                    ...(userEmail && { email: userEmail }),
                    ...(firstName && { first_name: firstName }),
                    ...(lastName && { last_name: lastName }),
                    ...(address && {
                        address: {
                            zip_code: address.zip_code,
                            street_name: address.street_name,
                            street_number: address.street_number
                        }
                    })
                },
                metadata: {
                    cartId,
                    userId: userId || null,
                    items: JSON.stringify(items),
                    orderId: cartId,
                    integration_type: "checkout_pro",
                    platform: "nextjs",
                    created_at: now.toISOString()
                },
                back_urls: {
                    success: `${APP_URL}/checkout/success?order_id=${cartId}`,
                    failure: `${APP_URL}/cart?error=payment_failed`,
                    pending: `${APP_URL}/checkout/success?order_id=${cartId}&status=pending`
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
                binary_mode: false,
                ...(shippingCost && shippingCost > 0 && {
                    shipments: {
                        cost: shippingCost,
                        mode: "not_specified"
                    }
                })
            },
            requestOptions: {
                idempotencyKey: cartId,
            }
        });

        if (!response.init_point) {
            throw new Error('❌ MP no retornó URL de checkout');
        }

        console.log(`✅ Preferencia MP creada: ${response.id} | Orden: ${cartId} | Monto: COP $${amount}`);

        return { initPoint: response.init_point, preferenceId: response.id as string };
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
            fullError: JSON.stringify(error)
        });
        // Relanza un error estándar con el mensaje útil
        throw new Error(
            `Error al procesar pago con Mercado Pago: ${errorMessage}`
        );
    }
}
