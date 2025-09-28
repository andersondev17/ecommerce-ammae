import { Footer, Navbar } from "@/components";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="bg-light-200 justify-between items-center ">
        <div className="bg-light-200 hidden md:flex justify-between items-center max-w-7xl mx-auto py-1">
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/sign-up" className="text-sm font-medium font-roboto text-muted-foreground hover:text-foreground transition-colors">
                            Registrarse

            </Link>
            <span className="text-border">|</span>
            <Link href="/sign-in" className="text-sm font-medium font-roboto text-muted-foreground hover:text-foreground transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>
      <Navbar />
      {children}
      <Toaster position="bottom-right" richColors closeButton />
      <Footer />
    </>
  );
}
