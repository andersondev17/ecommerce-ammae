//← server actions: createOrder, getOrder

"use server";

import { db } from "@/lib/db";
import { addresses, orderItems, orders, payments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth/actions";

export async function createOrder(payload: {
    orderId: string;
    paymentMethod: "mercadopago" | "whatsapp";
    status: "paid" | "pending";
    transactionId?: string;
    paidAt?: Date;
}) {
    // actualiza order + payment
    const { orderId, paymentMethod, status, transactionId, paidAt } = payload;

    await db.update(orders).set({ status }).where(eq(orders.id, orderId));

    // actualizar payment (idempotente)
    const existing = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);
    if (existing.length) {
        await db.update(payments).set({
            status: status === "paid" ? "completed" : existing[0].status,
            paidAt: paidAt ?? (status === "paid" ? new Date() : existing[0].paidAt),
            transactionId: transactionId ?? existing[0].transactionId,
        }).where(eq(payments.orderId, orderId));
    } else {
        await db.insert(payments).values({
            orderId,
            method: paymentMethod,
            status: status === "paid" ? "completed" : "initiated",
            paidAt: paidAt ?? null,
            transactionId: transactionId ?? null,
        });
    }

    return await getOrder(orderId);
}

export async function getOrder(orderId: string) {
    const ord = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!ord.length) return null;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const pays = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return { order: ord[0], items, payments: pays };
}

export async function updateOrderStatus(orderId: string, status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled') {
    try {
        await db
            .update(orders)
            .set({ status })
            .where(eq(orders.id, orderId));

        return { success: true };
    } catch (error) {
        console.error('Error updating order status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update order status',
        };
    }
}

export type AddressData = {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    type: "shipping" | "billing";
    isDefault?: boolean;
};

export async function getUserAddresses() {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: "Not authenticated" };

    try {
        const userAddresses = await db
            .select()
            .from(addresses)
            .where(eq(addresses.userId, user.id))
            .orderBy(addresses.isDefault);

        return { success: true, addresses: userAddresses };
    } catch {
        return { success: false, error: "Failed to fetch addresses" };
    }
}

export async function saveAddress(data: AddressData) {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: "Not authenticated" };

    try {
        // If setting as default, unset other defaults of same type
        if (data.isDefault) {
            await db
                .update(addresses)
                .set({ isDefault: false })
                .where(
                    and(
                        eq(addresses.userId, user.id),
                        eq(addresses.type, data.type)
                    )
                );
        }

        const newAddress = await db
            .insert(addresses)
            .values({
                userId: user.id,
                ...data,
                isDefault: data.isDefault ?? false,
            })
            .returning();

        revalidatePath("/checkout");
        return { success: true, address: newAddress[0] };
    } catch (error) {
        console.error("Address save error:", error);
        return { success: false, error: "Failed to save address" };
    }
}

export async function updateAddress(addressId: string, data: Partial<AddressData>) {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: "Not authenticated" };

    try {
        // Verify ownership
        const existingAddress = await db
            .select()
            .from(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)))
            .limit(1);

        if (!existingAddress.length) {
            return { success: false, error: "Address not found" };
        }

        // Handle default setting
        if (data.isDefault && data.type) {
            await db
                .update(addresses)
                .set({ isDefault: false })
                .where(
                    and(
                        eq(addresses.userId, user.id),
                        eq(addresses.type, data.type)
                    )
                );
        }

        const updatedAddress = await db
            .update(addresses)
            .set(data)
            .where(eq(addresses.id, addressId))
            .returning();

        revalidatePath("/checkout");
        return { success: true, address: updatedAddress[0] };
    } catch {
        return { success: false, error: "Failed to update address" };
    }
}

export async function deleteAddress(addressId: string) {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: "Not authenticated" };

    try {
        await db
            .delete(addresses)
            .where(and(eq(addresses.id, addressId), eq(addresses.userId, user.id)));

        revalidatePath("/checkout");
        return { success: true };
    } catch {
        return { success: false, error: "Failed to delete address" };
    }
}

export async function getDefaultAddress(type: "shipping" | "billing") {
    const user = await getCurrentUser();
    if (!user?.id) return null;

    const [defaultAddress] = await db
        .select()
        .from(addresses)
        .where(
            and(
                eq(addresses.userId, user.id),
                eq(addresses.type, type),
                eq(addresses.isDefault, true)
            )
        )
        .limit(1);

    return defaultAddress ?? null;
}
export async function getUserOrders() {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: "Not authenticated" };

    try {
        const userOrders = await db
            .select({
                id: orders.id,
                status: orders.status,
                totalAmount: orders.totalAmount,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .where(eq(orders.userId, user.id))
            .orderBy(orders.createdAt);

        return { success: true, orders: userOrders };
    } catch {
        return { success: false, error: "Failed to fetch orders" };
    }
}