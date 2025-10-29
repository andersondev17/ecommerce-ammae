"use client";

import { useSizeStore } from "@/store/size";
import { useVariantStore } from "@/store/variant";
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
  productName?: string;
  price?: number | null;
  variants: ProductVariant[];
  galleryVariants: GalleryVariant[];
  defaultVariantId?: string | null;
  isSticky?: boolean;
}

export default function ProductActions({
  productId,
  productName = 'Producto',
  variants,
  galleryVariants,
  defaultVariantId,
  price = null,
  isSticky = false,
}: ProductActionsProps) {
  const [show, setShow] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    defaultVariantId || variants[0]?.id
  );

  const selectedColorIndex = useVariantStore((s) => s.getSelected(productId, 0));
  const selectedSize = useSizeStore((s) => s.getSelected(productId));

  useEffect(() => {
    const selectedColor = galleryVariants[selectedColorIndex]?.color;

    const matchingVariant = variants.find(
      (v) =>
        (v.color?.name === selectedColor || (!v.color?.name && selectedColor === "Default")) &&
        v.size?.name === selectedSize
    );

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    } else {
      const colorVariant = variants.find(
        (v) => v.color?.name === selectedColor || (!v.color?.name && selectedColor === "Default")
      );

      if (colorVariant) {
        setSelectedVariantId(colorVariant.id);
      }
    }
  }, [selectedColorIndex, selectedSize, variants, galleryVariants]);

  useEffect(() => {
    if (!isSticky) return;

    const handleScroll = () => {
      setShow(window.scrollY > 600);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSticky]);

  if (isSticky && !show) return null;

  const containerClass = isSticky
    ? "fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-md border-b border-light-300 shadow-sm animate-in slide-in-from-top duration-300"
    : "flex flex-col gap-6";

  const innerClass = isSticky
    ? "mx-auto max-w-auto p-3 flex items-center gap-3 justify-between"
    : "flex flex-col gap-6";

  return (
    <div className={containerClass}>
      <div className={innerClass}>
        {isSticky ? (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-light tracking-wide  font-roboto-slab">{productName ? `${productName} ` : ""}</p>
              <p className="text-[13px] uppercase tracking-[0.1em] font-light text-dark-900 font-roboto-slab">{price !== null ? `$${price}` : 'Precio no disponible'}</p>
            </div>
            <div className="flex items-center gap-2">
              <SizePicker productId={productId} variants={variants}  compact />
              <AddToCartButton
                productId={productId}
                productVariantId={selectedVariantId || ""}
                disabled={!selectedVariantId}
                compact={isSticky}
              />
            </div>
          </>
        ) : (
          <>
            <ColorSwatches productId={productId} variants={galleryVariants} />
            <SizePicker productId={productId} variants={variants} />
            <AddToCartButton
              productId={productId}
              productVariantId={selectedVariantId || ""}
              disabled={!selectedVariantId}
            />
          </>
        )}
      </div>
    </div>
  );
}