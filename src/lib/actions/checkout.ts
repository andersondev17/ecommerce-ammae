"use server";

import { getCurrentUser, guestSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { addresses, cartItems, carts, guests, orderItems, orders, payments, productImages, productVariants, products } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { createMercadoPagoPreference } from "../payments/mercadopagoClient";
import { formatPrice } from "../utils";
import { DbClient, mergeCarts } from "./cart";

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
            })
            .from(cartItems)
            .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
            .innerJoin(products, eq(productVariants.productId, products.id))
            .leftJoin(productImages, and(
                eq(productImages.productId, products.id),
                eq(productImages.isPrimary, true)
            ))
            .where(eq(cartItems.cartId, cart.id));

        if (items.length === 0) {
            return { success: false, error: "Cart is empty" };
        }

        // Calculate total
        const subtotal = items.reduce((sum, item) => {
            const price = item.salePrice ?? item.price;
            return sum + (price * item.quantity);
        }, 0);

        const total = subtotal + 0; // Shipping in COP

        return method === 'mercadopago'
            ? handleMercadoPagoCheckout({ items, total, userId: user?.id, cartId: cart.id , userEmail: user?.email})
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
}
async function handleMercadoPagoCheckout({ items, total, userId, cartId , userEmail}: {
    items: CheckoutItem[];
    total: number;
    userId?: string;
    userEmail?: string;
    cartId: string;
}) {
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
            await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));

            return newOrder;
        }); // If any step fails, everything is automatically rolled back.

        // 4. Create Mercado Pago preference (outside the transaction)
        const checkoutUrl = await createMercadoPagoPreference({
            cartId: result.id,
            userId: userId,
            userEmail: userEmail,
            amount: total,
            items: items.map(item => ({
                name: item.productName,
                price: item.salePrice ?? item.price,
                quantity: item.quantity,
            })),
        });

        return { success: true, checkoutUrl, orderId: result.id };

    } catch (error) {
        console.error('MercadoPago checkout error:', error);
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
                    priceAtPurchase: (item.salePrice ?? item.price).toString(),
                }))
            );

            await tx.insert(payments).values({
                orderId: newOrder.id,
                method: "whatsapp",
                status: "initiated",
                transactionId: `WA-${newOrder.id}`,
            });
            await tx.delete(cartItems).where(eq(cartItems.cartId, cartId));
            return newOrder;
        });

        const phone = process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
        if (!phone) throw new Error("WHATSAPP_NUMBER not configured");

        const shortOrderId = result.id.slice(-8).toUpperCase();
        const shortUserId = userId?.slice(-8).toUpperCase();

        const itemsTxt = items.map(item =>
            `• ${item.quantity}x ${item.productName} - ${formatPrice((item.salePrice ?? item.price) * item.quantity)}`
        ).join('\n');

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

