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
  title: "AMMAE Colombia | Tienda Multimarca",
  description: "Descubre la nueva colección de de AMMAE online. Las últimas tendencias en prendas urbanas para dama y hombre",
  metadataBase: new URL("https://ammae.com.co"),
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
