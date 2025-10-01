"use client";

import CollapsibleSection from "@/components/CollapsibleSection";
import { useSizeStore } from "@/store/size";
import Image from "next/image";
import { useState } from "react";

export interface SizePickerProps {
  productId: string;
  variants: Array<{ size?: { name: string } | null }>;
  className?: string;
  compact?: boolean;
}

export default function SizePicker({ 
  productId, 
  variants, 
  className = "", 
  compact = false 
}: SizePickerProps) {
  const setSelected = useSizeStore((s) => s.setSelected);
  const selected = useSizeStore((s) => s.getSelected(productId));
  const [showGuide, setShowGuide] = useState(false);

  const sizes = [...new Set((variants || []).map(v => v.size?.name).filter((name): name is string => Boolean(name)))];
  const displaySizes = compact ? sizes.slice(0, 5) : sizes;

  const sizeButtons = (
    <div className={compact ? "flex items-center gap-1" : "grid grid-cols-4 gap-2 sm:grid-cols-6"}>
      {displaySizes.map((s) => {
        const isActive = selected === s;
        return (
          <button
            key={s}
            onClick={() => setSelected(productId, isActive ? null : s)}
            className={`rounded ${compact ? '' : '-lg'} border text-center transition ${
              compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-3 text-body focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500'
            } ${isActive ? "border-dark-900 bg-dark-900 text-white" : "border-light-300 text-dark-700 hover:border-dark-500"}`}
            aria-pressed={isActive}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
  
  return (
    <div className={className}>
      <CollapsibleSection title="Tallas" className="text-[13px] font-roboto text-black-900 tracking-wide  " defaultOpen={false}>
        {sizeButtons}
      </CollapsibleSection>
      <button className={`text-[13px] ${compact ? 'hidden' : 'block'} text-dark-700 tracking-wide underline-offset-2 hover:underline focus:outline-none pt-2`} onClick={() => setShowGuide(true)}>
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