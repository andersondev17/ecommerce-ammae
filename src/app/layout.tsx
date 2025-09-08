import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import {ReactNode} from "react";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
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
    <html lang="en">
      <body className={`${jost.className} antialiased`}>{children}</body>
    </html>
  );
}
