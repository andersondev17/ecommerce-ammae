"use client";

import { CartData } from "@/lib/actions/cart";
import { useCartStore } from "@/store/cart.store";
import Link from "next/link";
import { useEffect } from "react";
import { CartSummary } from "./checkout/CartSummary";
import { CheckoutInfo } from "./checkout/CheckoutInfo";
import { CartItem, CartSkeleton, EmptyCart } from "./index";
import { TrustBanner } from "./TrustBanner";

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
        price: item.price, // Convert to cents
        salePrice: item.salePrice ? item.salePrice : undefined
    }));

    const subtotal = itemsInCents.reduce((sum, item) => {
        const price = item.salePrice ?? item.price;
        return sum + (price * item.quantity);
    }, 0);

    const total = subtotal + 10000;

    return (
        <div className="mx-auto max-w-full pl-4 sm:pl-6 lg:pl-8 bg-light-200">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_500px] lg:grid-rows-[auto_1fr]">
                <div className="max-w-4x px-7 md:px-24">
                    {/* LEFT TOP */}
                    <div className="lg:row-start-1 lg:row-end-2 py-2 md:py-8">
                        <TrustBanner />
                    </div>

                    {/* LEFT BOTTOM */}
                    <div className="lg:row-start-2 lg:row-end-3 space-y-6 lg:border-light-300">
                        <div className="flex justify-between items-center m-2">
                            <h1 className="text-xl  md:text-2xl font-medium tracking-wide mb-6 font-roboto">
                                Mi selección <span className="text-muted-foreground text-base font-roboto font-light">({itemCount})</span>
                            </h1>
                            <Link href="/products" className="text-[12px] md:text-sm underline hover:text-gray-800 transition-colors">
                                Continuar comprando
                            </Link>
                        </div>

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
                </div>
                {/* RIGHT */}
                <aside className="lg:col-start-2 lg:row-span-2 lg:sticky lg:top-6 lg:self-start space-y-6 bg-white border  p-8">
                    <CartSummary items={itemsInCents} amount={total} />
                    <CheckoutInfo />
                </aside>
            </div>
        </div>
    );
}