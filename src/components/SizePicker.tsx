"use client";

import { useSizeStore } from "@/store/size";

const SIZES = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"];

export interface SizePickerProps {
  productId: string;
  className?: string;
}

export default function SizePicker({ productId, className = "" }: SizePickerProps) {
  const setSelected = useSizeStore((s) => s.setSelected);
  const selected = useSizeStore((s) => s.getSelected(productId));

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-body-medium text-dark-900">Select Size</p>
        <button className="text-caption text-dark-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]">
          Size Guide
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {SIZES.map((s) => {
          const isActive = selected === s;
          return (
            <button
              key={s}
              onClick={() => setSelected(productId, isActive ? null : s)}
              className={`rounded-lg border px-3 py-3 text-center text-body transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${
                isActive ? "border-dark-900 text-dark-900" : "border-light-300 text-dark-700 hover:border-dark-500"
              }`}
              aria-pressed={isActive}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
