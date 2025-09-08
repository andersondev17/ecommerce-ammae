"use client";

import { getCurrentUser } from "@/lib/auth/actions";
import { CartData } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CartItem, CartSkeleton, EmptyCart, OrderSummary } from "./index";

interface CartContentProps {
    initialCart: {
        success: boolean;
        data: CartData;
    };
}

export default function CartContent({ initialCart }: CartContentProps) {
    const router = useRouter();
    const { items, isLoading, isInitialized, updateQuantity, removeItem, initialize, setItems, getItemCount, getSubtotal, getTotal } = useCartStore();
       // Calcular valores computados
    const itemCount = getItemCount();
    const subtotal = getSubtotal();
    const total = getTotal();

    // Inicializar el store con datos del servidor
    useEffect(() => {
        if (initialCart.success && !isInitialized) {
            setItems(initialCart.data.items);
        } else if (!isInitialized) {
            // Use an async IIFE to properly handle the Promise
            (async () => {
                await initialize();
            })();
        }
    }, [initialCart, isInitialized, initialize, setItems]);

    const handleQuantityChange = async (productVariantId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            await removeItem(productVariantId);
        } else {
            await updateQuantity(productVariantId, newQuantity);
        }
    };

    const handleCheckout = async () => {
        const user = await getCurrentUser();
        if (!user) {
            router.push("/auth?redirect=/checkout");
        } else {
            router.push("/checkout");
        }
    };

    if (isLoading && !items.length) {
        return <CartSkeleton />;
    }

    if (!items.length) {
        return <EmptyCart />;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Cart ({itemCount})</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {items.map((item) => (
                        <CartItem
                            key={item.cartItemId}
                            item={item}
                            isLoading={isLoading}
                            onQuantityChange={handleQuantityChange}
                            onRemove={removeItem}
                        />
                    ))}
                </div>

                <OrderSummary
                    subtotal={subtotal}
                    total={total}
                    isLoading={isLoading}
                    onCheckout={handleCheckout}
                />
            </div>
        </div>
    );
}
