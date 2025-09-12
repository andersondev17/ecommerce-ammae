//  ← helper to merge guest + user sessions
import { db } from "@/lib/db";
import { cartItems, carts, guests } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function mergeGuestAndUserSessions(
    guestSessionToken: string | null,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!guestSessionToken) {
        return { success: true };
    }

    try {
        // Find guest record
        const [guestRecord] = await db
            .select()
            .from(guests)
            .where(eq(guests.sessionToken, guestSessionToken))
            .limit(1);

        if (!guestRecord) {
            return { success: true };
        }

        // Find guest cart
        const [guestCart] = await db
            .select()
            .from(carts)
            .where(eq(carts.guestId, guestRecord.id))
            .limit(1);

        if (!guestCart) {
            return { success: true };
        }

        // Find or create user cart
        let [userCart] = await db
            .select()
            .from(carts)
            .where(eq(carts.userId, userId))
            .limit(1);

        if (!userCart) {
            [userCart] = await db
                .insert(carts)
                .values({ userId, guestId: null })
                .returning();
        }

        // Get guest cart items
        const guestItems = await db
            .select()
            .from(cartItems)
            .where(eq(cartItems.cartId, guestCart.id));

        // Merge items in transaction
        await db.transaction(async (tx) => {
            for (const item of guestItems) {
                const [existingItem] = await tx
                    .select()
                    .from(cartItems)
                    .where(
                        and(
                            eq(cartItems.cartId, userCart.id),
                            eq(cartItems.productVariantId, item.productVariantId)
                        )
                    )
                    .limit(1);

                if (existingItem) {
                    await tx
                        .update(cartItems)
                        .set({
                            quantity: sql`${cartItems.quantity} + ${item.quantity}`,
                        })
                        .where(eq(cartItems.id, existingItem.id));
                } else {
                    await tx.insert(cartItems).values({
                        cartId: userCart.id,
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                    });
                }
            }

            // Clean up guest data
            await tx.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
            await tx.delete(carts).where(eq(carts.id, guestCart.id));
            await tx.delete(guests).where(eq(guests.id, guestRecord.id));
        });

        return { success: true };
    } catch (error) {
        console.error("Error merging sessions:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to merge sessions",
        };
    }
}