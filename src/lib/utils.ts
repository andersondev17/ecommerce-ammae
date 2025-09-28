import { clsx, type ClassValue } from "clsx";
import { randomUUID } from "crypto";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function generateUUID(): string {
  return randomUUID();
}

export const formatCategory = (cat: string): string => {
  const labels: Record<string, string> = {
    jeans: "Jeans", blusas: "Blusas",
    vestidos: "Vestidos", camisetas: "Camisetas",
    hoodies: "Hoodies", accesorios: "Accesorios",
    men: "Hombre", women: "Mujer", Women: "Mujer", unisex: "Unisex", Men: "Hombre"
  };
  return labels[cat] || cat;
};