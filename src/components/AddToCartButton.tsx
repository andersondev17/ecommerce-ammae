// src/components/AddToCartButton.tsx
"use client";

import { useCartStore } from "@/store/cart.store";
import { useSizeStore } from "@/store/size";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function AddToCartButton({
    productId,
    productVariantId,
    disabled = false
}: {
    productId: string;
    productVariantId: string;
    disabled?: boolean;
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
            className="flex items-center justify-center gap-2 rounded-full bg-dark-900 px-6 py-4 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] disabled:opacity-50"
        >
            <ShoppingBag className="h-5 w-5" />
            {isAdding ? "Adding..." : "Add to Bag"}
        </button>
    );
}
