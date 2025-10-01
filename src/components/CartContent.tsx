"use client";

import { CartData } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";
import { useEffect } from "react";
import { CartSummary } from "./checkout/CartSummary";
import { CartItem, CartSkeleton, EmptyCart } from "./index";

interface CartContentProps {
    initialCart: {
        success: boolean;
        data: CartData;
    };
}

export default function CartContent({ initialCart }: CartContentProps) {
    const { items, isLoading, isInitialized, updateQuantity, removeItem, initialize, setItems, getItemCount } = useCartStore();
    
    const itemCount = getItemCount();
    
    useEffect(() => {
        if (initialCart.success && !isInitialized) {
            setItems(initialCart.data.items);
        } else if (!isInitialized) {
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

    if (isLoading && !items.length) {
        return <CartSkeleton />;
    }

    if (!items.length) {
        return <EmptyCart />;
    }

    // Convert items to cents for proper calculation (assuming backend stores in cents)
    const itemsInCents = items.map(item => ({
        ...item,
        price: item.price , // Convert to cents
        salePrice: item.salePrice ? item.salePrice  : undefined
    }));

    const subtotal = itemsInCents.reduce((sum, item) => {
        const price = item.salePrice ?? item.price;
        return sum + (price * item.quantity);
    }, 0);

    const total = subtotal + 200; // Add shipping in cents

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Tu selección ({itemCount})</h1>

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
                <CartSummary
                    items={itemsInCents}
                    amount={total}
                />
            </div>
        </div>
    );
}