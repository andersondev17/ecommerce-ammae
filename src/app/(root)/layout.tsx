import { Footer, Navbar } from "@/components";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";


export default async function RootLayout({ children }: { children: ReactNode }) {

  return (
    <>
      <Navbar />
      {children}
      <CartDrawer />
      <Toaster position="bottom-right" richColors closeButton />
      <Footer />
    </>
  );
}
