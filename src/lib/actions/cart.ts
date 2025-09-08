"use server";

import { createGuestSession, getCurrentUser, guestSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { cartItems, carts, colors, guests, productImages, productVariants, products, sizes } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const cartCache = new Map();

// Validation schemas
const addCartItemSchema = z.object({
    productVariantId: z.string().uuid(),
    quantity: z.number().int().positive().max(10),
});

const updateCartItemSchema = z.object({
    productVariantId: z.string().uuid(),
    quantity: z.number().int().positive().max(10),
});

export type CartItem = {
    id: string;
    cartItemId: string;
    productVariantId: string;
    productId: string;
    name: string;
    price: number;
    salePrice?: number;
    quantity: number;
    image: string;
    color?: string;
    size?: string;
    sku: string;
};

export type CartData = {
    items: CartItem[];
    total: number;
    subtotal: number;
    itemCount: number;
};

async function getOrCreateCart() {
    const user = await getCurrentUser();
    const guest = await guestSession();

    const cacheKey = `cart-${user?.id || guest.sessionToken}`;
    if (cartCache.has(cacheKey)) {
        return cartCache.get(cacheKey);
    }

    let cart;

    // Try to get existing cart
    if (user?.id) {
        [cart] = await db
            .select()
            .from(carts)
            .where(eq(carts.userId, user.id))
            .limit(1);
    } else if (guest.sessionToken) {
        // Get guest record by sessionToken to find the actual guest.id
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

    // Create new cart if needed
    if (!cart) {
        if (user?.id) {
            [cart] = await db
                .insert(carts)
                .values({
                    userId: user.id,
                    guestId: null
                })
                .returning();
        } else {
            // Create or get guest session
            const sessionResult = guest.sessionToken
                ? { ok: true, sessionToken: guest.sessionToken }
                : await createGuestSession();

            if (!sessionResult.ok) {
                throw new Error("Failed to create guest session");
            }

            // Get the guest record by sessionToken
            const [guestRecord] = await db
                .select()
                .from(guests)
                .where(eq(guests.sessionToken, sessionResult.sessionToken))
                .limit(1);

            if (!guestRecord) {
                throw new Error("Failed to find guest record");
            }

            [cart] = await db
                .insert(carts)
                .values({
                    guestId: guestRecord.id,
                    userId: null
                })
                .returning();
        }
    }
    cartCache.set(cacheKey, cart);
    return cart;
}

export async function getCart(): Promise<{ success: boolean; data: CartData }> {
    try {
        const cart = await getOrCreateCart();
        const cacheKey = `cart-items-${cart.id}`;
        // Return cached items if available
        if (cartCache.has(cacheKey)) {
            return { success: true, data: cartCache.get(cacheKey) };
        }


        const items = await db
            .select({
                cartItemId: cartItems.id,
                productVariantId: cartItems.productVariantId,
                quantity: cartItems.quantity,
                variantId: productVariants.id,
                productId: products.id,
                productName: products.name,
                price: sql<number>`${productVariants.price}::numeric`,
                salePrice: sql<number>`${productVariants.salePrice}::numeric`,
                sku: productVariants.sku,
                colorName: colors.name,
                sizeName: sizes.name,
                imageUrl: productImages.url,
            })
            .from(cartItems)
            .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
            .innerJoin(products, eq(productVariants.productId, products.id))
            .leftJoin(colors, eq(productVariants.colorId, colors.id))
            .leftJoin(sizes, eq(productVariants.sizeId, sizes.id))
            .leftJoin(
                productImages,
                and(
                    eq(productImages.productId, products.id),
                    eq(productImages.isPrimary, true)
                )
            )
            .where(eq(cartItems.cartId, cart.id));

        const cartItemsData: CartItem[] = items.map(item => ({
            id: item.variantId,
            cartItemId: item.cartItemId,
            productVariantId: item.productVariantId,
            productId: item.productId,
            name: item.productName,
            price: Number(item.price),
            salePrice: item.salePrice ? Number(item.salePrice) : undefined,
            quantity: item.quantity,
            image: item.imageUrl || "/placeholder.jpg",
            color: item.colorName || undefined,
            size: item.sizeName || undefined,
            sku: item.sku,
        }));

        const subtotal = cartItemsData.reduce((sum, item) => {
            const price = item.salePrice ?? item.price;
            return sum + (price * item.quantity);
        }, 0);

        const itemCount = cartItemsData.reduce((sum, item) => sum + item.quantity, 0);
        const total = subtotal + 2.00; // $2.00 shipping
        const cartData = {
            items: cartItemsData,
            subtotal,
            total,
            itemCount,
        };
        // Cache the result
        cartCache.set(cacheKey, cartData);
        return { success: true, data: cartData };
    } catch (error) {
        console.error("Error getting cart:", error);
        return {
            success: false,
            data: {
                items: [],
                subtotal: 0,
                total: 0,
                itemCount: 0,
            },
        };
    }
}

export async function addCartItem(input: z.infer<typeof addCartItemSchema>) {
    try {
        const validatedData = addCartItemSchema.parse(input);
        const cart = await getOrCreateCart();

        // Check if item already exists in cart
        const existingItem = await db
            .select()
            .from(cartItems)
            .where(and(
                eq(cartItems.cartId, cart.id),
                eq(cartItems.productVariantId, validatedData.productVariantId)
            ))
            .limit(1);

        if (existingItem.length > 0) {
            await db
                .update(cartItems)
                .set({
                    quantity: sql`${cartItems.quantity} + ${validatedData.quantity}`
                })
                .where(eq(cartItems.id, existingItem[0].id));
        } else {
            await db
                .insert(cartItems)
                .values({
                    cartId: cart.id,
                    productVariantId: validatedData.productVariantId,
                    quantity: validatedData.quantity,
                });
        }

        // Invalidate specific cache instead of full revalidation
        cartCache.delete(`cart-items-${cart.id}`);
        revalidatePath("/cart", "page");
        return { success: true };
    } catch (error) {
        console.error("Error adding item to cart:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add item to cart"
        };
    }
}

export async function updateCartItem(input: z.infer<typeof updateCartItemSchema>) {
    try {
        const validatedData = updateCartItemSchema.parse(input);
        const cart = await getOrCreateCart();

        if (validatedData.quantity === 0) {
            return await removeCartItem(validatedData.productVariantId);
        }

        await db
            .update(cartItems)
            .set({ quantity: validatedData.quantity })
            .where(and(
                eq(cartItems.cartId, cart.id),
                eq(cartItems.productVariantId, validatedData.productVariantId)
            ));

        revalidatePath("/cart");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error updating cart item:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update cart item"
        };
    }
}

export async function removeCartItem(productVariantId: string) {
    try {
        const cart = await getOrCreateCart();

        await db
            .delete(cartItems)
            .where(and(
                eq(cartItems.cartId, cart.id),
                eq(cartItems.productVariantId, productVariantId)
            ));

        revalidatePath("/cart");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error removing cart item:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to remove cart item"
        };
    }
}

export async function clearCart() {
    try {
        const cart = await getOrCreateCart();

        await db
            .delete(cartItems)
            .where(eq(cartItems.cartId, cart.id));

        revalidatePath("/cart");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error clearing cart:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to clear cart"
        };
    }
}

export async function mergeCarts(guestSessionToken: string, userId: string) {
    try {
        // Get guest record by sessionToken
        const [guestRecord] = await db
            .select()
            .from(guests)
            .where(eq(guests.sessionToken, guestSessionToken))
            .limit(1);

        if (!guestRecord) {
            return { success: true }; // No guest record, nothing to merge
        }

        // Find guest cart using the actual guest.id
        const [guestCart] = await db
            .select()
            .from(carts)
            .where(eq(carts.guestId, guestRecord.id))
            .limit(1);

        if (!guestCart) return { success: true }; // No guest cart to merge

        // Find or create user cart
        let [userCart] = await db
            .select()
            .from(carts)
            .where(eq(carts.userId, userId))
            .limit(1);

        if (!userCart) {
            [userCart] = await db
                .insert(carts)
                .values({
                    userId,
                    guestId: null
                })
                .returning();
        }

        // Get guest cart items
        const guestItems = await db
            .select()
            .from(cartItems)
            .where(eq(cartItems.cartId, guestCart.id));

        // Use transaction for atomic operations
        await db.transaction(async (tx) => {
            for (const item of guestItems) {
                const [existingItem] = await tx
                    .select()
                    .from(cartItems)
                    .where(and(
                        eq(cartItems.cartId, userCart.id),
                        eq(cartItems.productVariantId, item.productVariantId)
                    ))
                    .limit(1);

                if (existingItem) {
                    // Update quantity if item exists
                    await tx
                        .update(cartItems)
                        .set({
                            quantity: sql`${cartItems.quantity} + ${item.quantity}`
                        })
                        .where(eq(cartItems.id, existingItem.id));
                } else {
                    // Add new item to user cart
                    await tx
                        .insert(cartItems)
                        .values({
                            cartId: userCart.id,
                            productVariantId: item.productVariantId,
                            quantity: item.quantity
                        });
                }
            }
            // Delete guest cart items first, then the cart
            await tx.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
            await tx.delete(carts).where(eq(carts.id, guestCart.id));
        });

        revalidatePath("/cart");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error merging carts:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to merge carts"
        };
    }
}