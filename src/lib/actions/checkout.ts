"use server";

import { getCurrentUser, guestSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { addresses, cartItems, carts, categories, guests, orderItems, orders, payments, productImages, productVariants, products, users } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { createMercadoPagoPreference } from "../payments/mercadopagoClient";
import { formatPrice } from "../utils";
import { DbClient, invalidateCartCache, mergeCarts } from "./cart";

// SAGA pattern to handle checkout
async function getActiveCart() {
    const user = await getCurrentUser();
    const guest = await guestSession();

    if (user?.id) {
        const [cart] = await db
            .select()
            .from(carts)
            .where(eq(carts.userId, user.id))
            .limit(1);
        return cart ?? null;
    }

    if (guest.sessionToken) {
        const result = await db
            .select({
                cart: carts,
            })
            .from(guests)    //  LEFT JOIN para guests
            .leftJoin(carts, eq(carts.guestId, guests.id))
            .where(eq(guests.sessionToken, guest.sessionToken))
            .limit(1);

        return result[0]?.cart ?? null;
    }

    return null;
}
async function validateStock(items: CheckoutItem[], tx: DbClient) {
    const variantIds = items.map(i => i.productVariantId);

    const variants = await tx
        .select({ id: productVariants.id, inStock: productVariants.inStock })
        .from(productVariants)
        .where(inArray(productVariants.id, variantIds))
        .for('update');// Lock until the transaction ends

    const stockMap = new Map(variants.map(v => [v.id, v.inStock]));

    for (const item of items) {
        const stock = stockMap.get(item.productVariantId);
        if (!stock || stock < item.quantity) {
            throw new Error(`Stock insuficiente: ${item.productName}`);
        }
    }
}
// Enhanced payment processing with better error handling
export async function handleCheckout(method: 'mercadopago' | 'whatsapp') {
    console.log(`Starting checkout with method: ${method}`);

    try {
        const user = await getCurrentUser();
        const guest = await guestSession();

        if (!user?.id && !guest.sessionToken) {
            return { success: false, error: "No active session found" };
        }

        // Merge carts if user is logged in and has guest session
        if (user?.id && guest.sessionToken) {
            await mergeCarts(guest.sessionToken, user.id);
        }

        // Get cart
        const cart = await getActiveCart();

        if (!cart) {
            return { success: false, error: "No cart found" };
        }

        // Get cart items
        const items = await db
            .select({
                productName: products.name,
                quantity: cartItems.quantity,
                price: sql<number>`${productVariants.price}::numeric`,
                salePrice: sql<number>`${productVariants.salePrice}::numeric`,
                imageUrl: productImages.url,
                productVariantId: cartItems.productVariantId,
                categorySlug: categories.slug,
            })
            .from(cartItems)
            .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
            .innerJoin(products, eq(productVariants.productId, products.id))
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .leftJoin(productImages, and(
                eq(productImages.productId, products.id),
                eq(productImages.isPrimary, true)
            ))
            .where(eq(cartItems.cartId, cart.id));

        if (items.length === 0) {
            return { success: false, error: "El carrito está vacío" };
        }

        // Calculate total
        const subtotal = items.reduce((sum, item) => {
            const price = Number(item.salePrice ?? item.price);
            return sum + (price * item.quantity);
        }, 0);

        const total = subtotal + 0; // Shipping in COP

        return method === 'mercadopago'
            ? handleMercadoPagoCheckout({ items, total, userId: user?.id, cartId: cart.id, user })
            : handleWhatsAppCheckout({ items, total, userId: user?.id, cartId: cart.id });

    } catch (error) {
        console.error('Checkout error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Checkout failed'
        };
    }
}
interface CheckoutItem {
    productName: string;
    quantity: number;
    price: number;
    salePrice: number | null;
    imageUrl: string | null;
    productVariantId: string;
    categorySlug: string | null;
}
async function handleMercadoPagoCheckout({ items, total, userId, cartId, user }: {
    items: CheckoutItem[];
    total: number;
    userId?: string;
    user?: { id: string; email: string; name?: string | null; } | null;
    cartId: string;
}) {
    let orderId: string | null = null;
    const invalidItems = items.filter(item =>
        !item.productName ||
        !item.price ||
        item.price <= 0 ||
        !item.quantity
    );

    if (invalidItems.length > 0) {
        console.error('[MP Checkout] Items inválidos:', invalidItems);
        throw new Error('Productos sin información completa. Recarga el carrito.');
    }
    try {
        const result = await db.transaction(async (tx) => {
            await validateStock(items, tx);

            // 1. Create order
            const [newOrder] = await tx.insert(orders).values({
                userId: userId ?? null,
                status: "pending",
                totalAmount: total.toFixed(2),
                createdAt: new Date(),
            }).returning();

            // 2. Insert order items
            await tx.insert(orderItems).values(
                items.map(item => ({
                    orderId: newOrder.id,
                    productVariantId: item.productVariantId,
                    quantity: item.quantity,
                    priceAtPurchase: (item.salePrice ?? item.price).toString(),
                }))
            );

            // 3. Create payment record
            await tx.insert(payments).values({
                orderId: newOrder.id,
                method: "mercadopago",
                status: "initiated",
                transactionId: `pref-${newOrder.id}`
            });

            return newOrder;
        }); // If any step fails, everything is automatically rolled back.

        orderId = result.id;
        const mpItems = items.map((item, index) => {
            const itemPrice = Number(item.salePrice ?? item.price);

            // Valida que el precio sea válido
            if (isNaN(itemPrice) || itemPrice <= 0) {
                throw new Error(`Precio inválido para ${item.productName}`);
            }

            return {
                id: `item-${index}`,
                title: item.productName.slice(0, 100), // MP limita a 100 chars
                quantity: item.quantity,
                unit_price: itemPrice,
                currency_id: "COP",
                picture_url: item.imageUrl || undefined,
            };
        });

        console.log('[MP Checkout] Items enviados a MP:', mpItems.map(i => ({
            title: i.title,
            price: i.unit_price,
            quantity: i.quantity,
            currency_id: i.currency_id,
            
        })));
        
        // Obtener dirección del usuario si existe
        const userAddress = userId ? await db
            .select()
            .from(addresses)
            .where(and(
                eq(addresses.userId, userId),
                eq(addresses.isDefault, true)
            ))
            .limit(1) : [];
        
        const address = userAddress[0];
        
        // Obtener datos completos del usuario desde BD para calidad MP
        let userEmail = user?.email;
        
        if (userId) {
            const [dbUser] = await db
                .select({ 
                    email: users.email, 
                    name: users.name,
                })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);
            
            if (!userEmail) {
                userEmail = dbUser?.email;
                console.log('[Checkout] Email obtenido de DB:', userEmail);
            }
        }
        
        // Separar nombre completo en firstName y lastName
        const nameParts = user?.name?.split(' ') || [];
        const firstName = nameParts[0] || userEmail?.split('@')[0] || undefined;
        const lastName = nameParts.slice(1).join(' ') || undefined;
        
        // 4. Create Mercado Pago preference (outside the transaction)
        const { initPoint, preferenceId } = await createMercadoPagoPreference({
            cartId: result.id,
            userId: userId,
            userEmail: userEmail,
            amount: total,
            items: items.map(item => ({
                name: item.productName,
                price: Number(item.salePrice ?? item.price),
                quantity: item.quantity,
                category_id: item.categorySlug || "others",
                description: item.productName,
                picture_url: item.imageUrl || undefined,
            })),
            // Campos para calidad MP
            firstName,
            lastName,
            address: address ? {
                street_name: address.line1 || undefined,
                street_number: (address.line2 ?? '').match(/\d+/)?.[0] || undefined,
                zip_code: address.postalCode || undefined,
            } : undefined,
        });
        console.log('Items para MP:', items.map(item => ({
            name: item.productName,
            price: Number(item.salePrice ?? item.price),
            type: typeof Number(item.salePrice ?? item.price)
        })));

        // Actualiza el registro de pago con el preference_id para trazabilidad
        await db.update(payments)
            .set({ transactionId: preferenceId })
            .where(eq(payments.orderId, result.id));

        // Limpiar carrito  después de crear la preferencia exitosamente
        await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
        await invalidateCartCache(cartId);

        return { success: true, checkoutUrl: initPoint, orderId: result.id };

    } catch (error) {
        console.error('[MP Checkout] Error:', error);

        // ROLLBACK MANUAL: Cancelar orden si MP falla
        if (orderId) {
            try {
                await db.update(orders)
                    .set({ status: "cancelled" })
                    .where(eq(orders.id, orderId));
                console.log(`[MP Checkout] Order ${orderId} cancelled due to MP error`);
            } catch (rollbackError) {
                console.error('[MP Checkout] Rollback failed:', rollbackError);
            }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'MercadoPago checkout failed'
        };
    }
}
async function handleWhatsAppCheckout({ items, total, userId, cartId }: {
    items: CheckoutItem[];
    total: number;
    userId?: string;
    cartId: string;
}) {
    try {
        const result = await db.transaction(async (tx) => {
            await validateStock(items, tx);
            const [newOrder] = await tx.insert(orders).values({
                userId: userId ?? null,
                status: "pending",
                totalAmount: total.toFixed(2),
                createdAt: new Date(),
            }).returning();

            await tx.insert(orderItems).values(
                items.map(item => ({
                    orderId: newOrder.id,
                    productVariantId: item.productVariantId,
                    quantity: item.quantity,
                    priceAtPurchase: (Number(item.salePrice ?? item.price)).toString(),
                }))
            );

            await tx.insert(payments).values({
                orderId: newOrder.id,
                method: "whatsapp",
                status: "initiated",
                transactionId: `WA-${newOrder.id}`,
            });
            await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
            await invalidateCartCache(cartId);
            return newOrder;
        });

        const phone = process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
        if (!phone) throw new Error("WHATSAPP_NUMBER not configured");

        const shortOrderId = result.id.slice(-8).toUpperCase();
        const shortUserId = userId?.slice(-8).toUpperCase();

        const itemsTxt = items.map(item => {
            const price = Number(item.salePrice ?? item.price);
            return `• ${item.quantity}x ${item.productName} - ${formatPrice(price * item.quantity)}`;
        }).join('\n');

        const message = encodeURIComponent(
            `*¡Tu pedido ya está listo para confirmar!*\n\n` +
            `*Orden #${shortOrderId}*\n` +
            `${itemsTxt}\n\n` +
            `*Envío:* GRATIS\n` +
            `*Total:* ${formatPrice(total)}\n\n` +
            `Cliente: ${shortUserId ?? "Invitado"}\n\n` +
            `Tu pedido será enviado cuando confirmemos el pago.`
        );

        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        const successUrl = `${baseUrl}/checkout/success?order_id=${result.id}&method=whatsapp&wa_url=${encodeURIComponent(whatsappUrl)}`;

        return {
            success: true,
            checkoutUrl: successUrl,
            orderId: result.id,
            whatsappUrl
        };

    } catch (error) {
        console.error('WhatsApp checkout error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'WhatsApp checkout failed'
        };
    }
}

export async function validateCheckoutRequirements() {
    const user = await getCurrentUser();

    if (!user?.id) {
        return { success: true, requiresAuth: true };
    }

    // Check if user has default shipping address
    const defaultAddress = await db
        .select()
        .from(addresses)
        .where(and(
            eq(addresses.userId, user.id),
            eq(addresses.type, "shipping"),
            eq(addresses.isDefault, true)
        ))
        .limit(1);

    return {
        success: true,
        requiresAuth: false,
        hasDefaultAddress: defaultAddress.length > 0,
        requiresAddress: defaultAddress.length === 0
    };
}

