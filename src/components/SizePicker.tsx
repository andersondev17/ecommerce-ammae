"use client";

import CollapsibleSection from "@/components/CollapsibleSection";
import { useSizeStore } from "@/store/size";
import Image from "next/image";
import { useState } from "react";

export interface SizePickerProps {
  productId: string;
  variants: Array<{ size?: { name: string } | null }>;
  className?: string;
}

export default function SizePicker({ productId, variants, className = "" }: SizePickerProps) {
  const setSelected = useSizeStore((s) => s.setSelected);
  const selected = useSizeStore((s) => s.getSelected(productId));
  const [showGuide, setShowGuide] = useState(false);

  // Extract sizes from variants
  const sizes = [...new Set((variants || []).map(v => v.size?.name).filter((name): name is string => Boolean(name)))];



  return (
    <div className={className}>
      <CollapsibleSection
        title="Seleccione su talla"
        className="text-[13px] font-roboto text-black-900 font-light "
        defaultOpen={true}
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {sizes.map((s) => {
            const isActive = selected === s;
            return (
              <button
                key={s}
                onClick={() => setSelected(productId, isActive ? null : s)}
                className={`rounded-lg border px-3 py-3 text-center text-body transition focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500 ${isActive
                    ? "border-dark-900 bg-dark-900 text-white"
                    : "border-light-300 text-dark-700 hover:border-dark-500"
                  }`}
                aria-pressed={isActive}
              >
                {s}
              </button>
            );
          })}
        </div>
      </CollapsibleSection>
      <button
        className="text-[13px] text-dark-700 underline-offset-2 hover:underline focus:outline-none pt-2"
        onClick={() => setShowGuide(true)}
      >
        Guía de tallas
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowGuide(false)}>
          <Image src="/policy/sizeGuide.jpeg" alt="Size Guide" className="max-w-2xl w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}