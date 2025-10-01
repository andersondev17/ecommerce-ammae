"use client";

import { useCartStore } from "@/store/cart.store";
import { useSizeStore } from "@/store/size";
import { useState } from "react";
import { toast } from "sonner";

export function AddToCartButton({
    productId,
    productVariantId,
    disabled = false,
    compact = false

}: {
    productId: string;
    productVariantId: string;
    disabled?: boolean;
    compact?: boolean;

}) {
    const [isAdding, setIsAdding] = useState(false);
    const { addItem } = useCartStore();
    const selectedSize = useSizeStore((s) => s.getSelected(productId));

    const handleAddToCart = async () => {
        if (disabled) return;

        // Check if size is selected
        if (!selectedSize) {
            toast.error("Please select a size before adding to bag");
            return;
        }

        setIsAdding(true);
        try {
            await addItem(productVariantId, 1);
        } catch (error) {
            console.error("Failed to add item to cart:", error);
            toast.error("Failed to add item to bag");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <button
            onClick={handleAddToCart}
            disabled={disabled || isAdding}
            className={`flex items-center ${compact ? "py-2 px-4 text-xs " : "px-4 py-3 text-xs md:text-sm "} tracking-wide justify-center gap-2 font-roboto-slab rounded-full bg-dark-900 border-2 border-dark-900  text-body-medium text-light-100 transition-colors hover:bg-light-100 hover:text-dark-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] disabled:opacity-50`}
        >
            {isAdding ? "Añadiendo..." : "Colocar en el carrito"}
        </button>
    );
}
