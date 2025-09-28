"use client";

import { useSizeStore } from "@/store/size";
import { useVariantStore } from "@/store/variant";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import ColorSwatches from "./ColorSwatches";
import SizePicker from "./SizePicker";

type GalleryVariant = { color: string; images: string[] };

interface ProductVariant {
  id: string;
  color?: { name: string } | null;
  size?: { name: string } | null;
}

interface ProductActionsProps {
  productId: string;
  variants: ProductVariant[];
  galleryVariants: GalleryVariant[];
  defaultVariantId?: string | null;
}

export default function ProductActions({
  productId,
  variants,
  galleryVariants,
  defaultVariantId,
}: ProductActionsProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    defaultVariantId || variants[0]?.id
  );

  const selectedColorIndex = useVariantStore((s) => s.getSelected(productId, 0));
  const selectedSize = useSizeStore((s) => s.getSelected(productId));

  // Update the selected variant when color or size changes
  useEffect(() => {
    // Find the variant that matches the selected color and size
    const selectedColor = galleryVariants[selectedColorIndex]?.color;

    const matchingVariant = variants.find(
      (v) => 
        (v.color?.name === selectedColor || (!v.color?.name && selectedColor === "Default")) && 
        v.size?.name === selectedSize
    );

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    } else {
      // If no exact match, try to find a variant with just the selected color
      const colorVariant = variants.find(
        (v) => v.color?.name === selectedColor || (!v.color?.name && selectedColor === "Default")
      );

      if (colorVariant) {
        setSelectedVariantId(colorVariant.id);
      }
    }
  }, [selectedColorIndex, selectedSize, variants, galleryVariants, productId]);

  return (
    <div className="flex flex-col gap-6">
      <ColorSwatches productId={productId} variants={galleryVariants} />
      <SizePicker productId={productId}  variants={variants} />

      <div className="flex flex-col gap-3">
        <AddToCartButton
          productId={productId}
          productVariantId={selectedVariantId || ""}
          disabled={!selectedVariantId}
        />
        <button className="flex items-center justify-center gap-2 rounded-full border border-light-300 px-6 py-3 text-body-medium text-dark-900 transition hover:border-dark-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          <Heart className="h-5 w-5" />
          Favorito
        </button>
      </div>
    </div>
  );
}
