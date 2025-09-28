import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";
const roboto = Roboto({
  weight: ['300', '400', '700'],
  subsets: ["latin"],
  variable: '--font-roboto',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "AMMAE",
  description: "Tienda Virtual para AMMAE zapatos, jeans, y ropa juvenil",
};

export default function RootShell({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" className={`${roboto.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
