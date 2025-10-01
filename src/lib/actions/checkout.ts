"use server";

import { getCurrentUser, guestSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { addresses, cartItems, carts, guests, orderItems, orders, payments, productImages, productVariants, products } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createMercadoPagoPreference } from "../payments/mercadopagoClient";
import { formatCurrency } from "../utils";
import { mergeCarts } from "./cart";

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
        let cart;
        if (user?.id) {
            [cart] = await db
                .select()
                .from(carts)
                .where(eq(carts.userId, user.id))
                .limit(1);
        } else if (guest.sessionToken) {
            const [guestRecord] = await db
                .select()
                .from(guests)
                .where(eq(guests.sessionToken, guest.sessionToken))
                .limit(1);

            if (guestRecord) {
                [cart] = await db
                    .select()
                    .from(carts)
                    .where(eq(carts.guestId, guestRecord.id))
                    .limit(1);
            }
        }

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

        const total = subtotal + 200; // Shipping in COP

        console.log(`Total: $${total} COP`);

        if (method === 'mercadopago') {
            return await handleMercadoPagoCheckout({
                items,
                total,
                userId: user?.id,
            });
        } else {
            return await handleWhatsAppCheckout({
                items,
                total,
                userId: user?.id,
            });
        }

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
async function handleMercadoPagoCheckout({ items, total, userId }: {
    items: CheckoutItem[];
    total: number;
    userId?: string;
}) {
    try {
        // 1. Crear orden en BD ANTES de crear preferencia MP
        const [newOrder] = await db.insert(orders).values({
            userId: userId ?? null,
            status: "pending",
            totalAmount: total.toFixed(2),
            createdAt: new Date(),
        }).returning();

        const orderId = newOrder.id;

        // 2. Insertar items de la orden
        await db.insert(orderItems).values(
            items.map(item => ({
                orderId,
                productVariantId: item.productVariantId,
                quantity: item.quantity,
                priceAtPurchase: (item.salePrice ?? item.price).toString(),
            }))
        );
        // 3. Crear payment record inicial
        await db.insert(payments).values({
            orderId,
            method: "mercadopago",
            status: "initiated",
            transactionId: `MP-${orderId}`,
        });

        // 4. Crear preferencia MP y DEVOLVER URL para client-side redirect
        const checkoutUrl = await createMercadoPagoPreference({
            cartId: orderId, // external_reference
            userId: userId,
            amount: total,
            items: items.map(item => ({
                name: item.productName,
                price: item.salePrice ?? item.price,
                quantity: item.quantity,
            })),
        });

        console.log('MP Checkout URL created:', checkoutUrl);

        // cliente manejará redirect
        return { success: true, checkoutUrl, orderId };

    } catch (error) {
        console.error('MercadoPago checkout error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'MercadoPago checkout failed'
        };
    }
}

async function handleWhatsAppCheckout({ items, total, userId }: {
    items: CheckoutItem[];
    total: number;
    userId?: string;
}) {
    try {
        // 1. Crear orden en BD
        const [newOrder] = await db.insert(orders).values({
            userId: userId ?? null,
            status: "pending",
            totalAmount: total.toFixed(2),
            createdAt: new Date(),
        }).returning();

        const orderId = newOrder.id;

        // 2. Insertar items
        await db.insert(orderItems).values(
            items.map(item => ({
                orderId,
                productVariantId: item.productVariantId,
                quantity: item.quantity,
                priceAtPurchase: (item.salePrice ?? item.price).toString(),
            }))
        );
        // 3. Crear payment record
        await db.insert(payments).values({
            orderId,
            method: "whatsapp",
            status: "initiated",
            transactionId: `WA-${orderId}`,
        });
        const shortOrderId = orderId.slice(-8).toUpperCase();
        const shortUserId = userId?.slice(-8).toUpperCase();

        // 4. Generar WhatsApp URL y DEVOLVERLA
        const phone = process.env.WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
        if (!phone) {
            throw new Error("WHATSAPP_NUMBER not configured");
        }
        const totalFmt = (amount: number) =>
            new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);

        const itemsTxt = items.map(item =>
            `• ${item.quantity}x ${item.productName} - ${formatCurrency((item.salePrice ?? item.price) * item.quantity)}`
        ).join('\n');

        const message = encodeURIComponent(
            ` *¡Tu pedido ya está listo para confirmar!*\n\n` +
            ` *Orden #${shortOrderId}*\n` +
            `${itemsTxt}\n\n` +
            // 4. CALL the totalFmt function to format the subtotal and total
            ` *Envío:* $10.000\n` +
            ` *Total:* ${totalFmt(total)}\n\n` +
            ` Cliente: ${shortUserId ?? "Invitado"}\n\n` +
            ` Tu pedido será enviado cuando confirmemos el pago.`
        );

        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

        console.log('WhatsApp URL created:', whatsappUrl);

        //  cliente manejará redirect
        return {
            success: true,
            checkoutUrl: whatsappUrl,
            orderId
        }


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

