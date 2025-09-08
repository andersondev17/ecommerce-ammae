"use client";

import { create } from "zustand";

type State = {
  selectedByProduct: Record<string, string | null>;
  setSelected: (productId: string, size: string | null) => void;
  getSelected: (productId: string) => string | null;
};

export const useSizeStore = create<State>((set, get) => ({
  selectedByProduct: {},
  setSelected: (productId, size) =>
    set((s) => ({
      selectedByProduct: { ...s.selectedByProduct, [productId]: size },
    })),
  getSelected: (productId) => {
    const map = get().selectedByProduct;
    return map[productId] ?? null;
  },
}));