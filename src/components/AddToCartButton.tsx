"use client";

import { useCartStore } from "@/store/cart.store";
import { useSizeStore } from "@/store/size";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/Button";

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
            toast.error("Porfavor seleccione una talla");
            return;
        }

        setIsAdding(true);
        try {
            await addItem(productVariantId, 1);
        } catch (error) {
            console.error("Failed to add item to cart:", error);
            toast.error("No se pudo añadir el producto al carrito");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Button
            onClick={handleAddToCart}
            disabled={disabled}
            isLoading={isAdding}
            size={compact ? "sm" : "md"}
        >
            Colocar en el carrito
        </Button>
    );
}
