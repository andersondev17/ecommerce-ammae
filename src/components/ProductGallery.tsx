"use client";

import { useVariantStore } from "@/store/variant";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Variant = {
  color: string;
  images: string[];
};

export interface ProductGalleryProps {
  productId: string;
  variants: Variant[];
  initialVariantIndex?: number;
  className?: string;
}

function isValidSrc(src: string | undefined | null) {
  return typeof src === "string" && src.trim().length > 0;
}

export default function ProductGallery({
  productId,
  variants,
  initialVariantIndex = 0,
  className = "",
}: ProductGalleryProps) {
  const validVariants = useMemo(
    () => variants.filter((v) => Array.isArray(v.images) && v.images.some(isValidSrc)),
    [variants]
  );

  const variantIndex =
    useVariantStore(
      (s) => s.selectedByProduct[productId] ?? Math.min(initialVariantIndex, Math.max(validVariants.length - 1, 0))
    );

  const images = validVariants[variantIndex]?.images?.filter(isValidSrc) ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [variantIndex]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (images.length === 0) return;
      setActiveIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!mainRef.current) return;
      if (!document.activeElement) return;
      if (!mainRef.current.contains(document.activeElement)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const isVideo = (src: string) => /\.(mp4|webm|ogg)$/i.test(src);

  return (
    <section className={`relative ${className}`}>
      {images.length > 0 ? (
        <>
          {/* Mobile: Single image  */}
          <div ref={mainRef} className="relative w-full h-full overflow-hidden bg-light-200 lg:hidden">
            {isVideo(images[activeIndex]) ? (
              <video src={images[activeIndex]} className="w-full h-full object-contain" autoPlay muted loop playsInline />
            ) : (
              <Image src={images[activeIndex]} alt="Product image" fill sizes="(min-width:1024px) 720px, 100vw" className="object-contain" priority />
            )}

            <div className="absolute inset-0 flex items-center justify-between px-2">
              <button
                aria-label="Previous image"
                onClick={() => go(-1)}
                className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
              >
                <ChevronLeft className="h-5 w-5 text-dark-900" />
              </button>
              <button
                aria-label="Next image"
                onClick={() => go(1)}
                className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
              >
                <ChevronRight className="h-5 w-5 text-dark-900" />
              </button>
            </div>
          </div>

          {/* Desktop: Vertical scroll */}
          <div className="hidden lg:flex flex-col">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative w-full aspect-[4/3] overflow-hidden bg-light-200"
              >
                {isVideo(img) ? (
                  <video src={img} className="w-full h-full object-contain" autoPlay muted loop playsInline />
                ) : (
                  <Image
                    src={img}
                    alt={`Product image ${idx + 1}`}
                    fill
                    sizes="(min-width:1024px) 720px, 100vw"
                    className="object-cover object-top"
                    priority={idx === 0}
                  />
                )}
              </div>
            ))}
           </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-dark-700">
            <div className="flex items-center gap-2 rounded-lg border border-light-300 bg-light-100 px-4 py-3">
              <ImageOff className="h-5 w-5" />
              <span className="text-body">No images available</span>
            </div>
          </div>
        )}
    </section>
  );
}
