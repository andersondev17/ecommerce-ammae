import { clsx, type ClassValue } from "clsx";
import { randomUUID } from "crypto";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function generateUUID(): string {
  return randomUUID();
}