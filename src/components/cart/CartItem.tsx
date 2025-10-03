"use client";

import { CartItem as CartItemType } from "@/lib/actions/cart";
import { formatPrice } from "@/lib/utils";
import { ChevronRight, Trash2, ZoomIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CartItemProps {
  item: CartItemType;
  isLoading: boolean;
  onQuantityChange: (productVariantId: string, quantity: number) => void;
  onRemove: (productVariantId: string) => void;
}

export function CartItem({ item, isLoading, onQuantityChange, onRemove }: CartItemProps) {
  const [showZoom, setShowZoom] = useState(false);
  const displayPrice = item.salePrice ?? item.price;
  const totalPrice = displayPrice * item.quantity;

  const discount = item.salePrice
    ? Math.round(((item.price - item.salePrice) / item.price) * 100)
    : null;

  const maxQuantity = Math.min(item.inStock, 10);
  const availableQuantities = Array.from({ length: maxQuantity }, (_, i) => i + 1);

  return (
    <>
      <article
        className="group grid grid-cols-[minmax(120px,35%)_1fr] md:grid-cols-2 gap-2.5 md:gap-4 
                   bg-white rounded-md overflow-hidden
                   border border-light-200 md:border-0 md:shadow-none md:rounded-lg
                   p-2.5 md:p-0 transition-all duration-200 hover:shadow-md"
        aria-labelledby={`cart-item-${item.productVariantId}`}
      >
        {/* LEFT: Image */}
        <div className="relative aspect-[3/4] md:aspect-[4/5] bg-gradient-to-b from-light-100 to-light-50 
                        flex items-center justify-center rounded-sm overflow-hidden md:p-4">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 35vw, 50vw"
            priority
          />

          <button
            onClick={() => setShowZoom(true)}
            className="flex absolute top-3 right-3 items-center justify-center w-8 h-8 rounded-full
                       border border-light-200 bg-white text-dark-900 hover:bg-light-50 hover:border-dark-400 
                       transition-all duration-200"
            aria-label={`Ver imagen ampliada de ${item.name}`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT: Info */}
        <div className="flex flex-col min-h-0 md:p-4 md:border-l md:border-light-400 border-0">
          {/* Header */}
          <div className="space-y-0.5 px-4 py-8 md:pb-6 border-b border-light-400 ">
            <p className="text-[10px] md:text-[11px] uppercase tracking-wider text-dark-400 font-light font-roboto">
              {item.sku}
            </p>

            <Link
              href={`/products/${item.productId}`}
              className="flex items-center justify-between gap-2 group/link"
            >
              <h3
                id={`cart-item-${item.productVariantId}`}
                className="text-[16px] md:text-lg font-light text-dark-900 font-roboto-slab 
                         leading-tight group-hover/link:text-dark-700 transition-colors line-clamp-2"
              >
                {item.name}
              </h3>
              <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-dark-400 flex-shrink-0 
                                   group-hover/link:text-dark-900 group-hover/link:translate-x-1 transition-all" />
            </Link>
          </div>

            {/* Attributes */}
            {(item.color || item.size) && (
              <dl className="grid grid-cols-[auto_1fr]  px-4 gap-x-4 gap-y-2 text-[12px] md:text-sm py-2 md:py-8">
                {item.color && (
                  <>
                    <dt className="text-dark-700 font-light">Color</dt>
                    <dd className="text-dark-900 font-roboto text-right md:text-left">{item.color}</dd>
                  </>
                )}
                {item.size && (
                  <>
                    <dt className="text-dark-700 font-light">Talla</dt>
                    <dd className="text-dark-900 font-roboto text-right md:text-left">{item.size}</dd>
                  </>
                )}
              </dl>
            )}
          {/* Precio unitario  */}
          {item.salePrice && discount && (
            <div className="hidden md:flex items-center gap-2 pb-3">
              <span className="text-base font-normal text-dark-900 font-roboto-slab">
                {formatPrice(displayPrice)}
              </span>
              <span className="rounded-full bg-green-50 border border-green-100 
                             px-2 py-0.5 text-xs text-green-700 font-medium">
                -{discount}%
              </span>
            </div>
          )}

          {/* Bottom: Quantity + Total */}
          <div className="mt-auto pt-2 md:pt-3 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <select
                id={`qty-${item.productVariantId}`}
                value={String(item.quantity)}
                onChange={(e) => onQuantityChange(item.productVariantId, Number(e.target.value))}
                disabled={isLoading}
                className="min-w-[3rem] px-2 py-1 border border-light-400 rounded text-sm bg-white 
                         focus:outline-none focus:ring-1 focus:ring-dark-500 focus:border-dark-500
                         hover:border-dark-400 transition-colors disabled:opacity-50"
              >
                {availableQuantities.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>

              <span className="text-sm md:text-base font-medium text-dark-900 font-roboto-slab">
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => onRemove(item.productVariantId)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs 
                       font-light text-dark-600 hover:text-red-600 border-t border-light-400
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Eliminar ${item.name} del carrito`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </article>

      {/* Zoom Modal */}
      {showZoom && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 
                     animate-in fade-in duration-200"
          onClick={() => setShowZoom(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-3xl w-full aspect-[4/5]">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  );
}