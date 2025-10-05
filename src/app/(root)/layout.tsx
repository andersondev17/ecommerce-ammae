import { Footer, Navbar } from "@/components";
import UserMenu from "@/components/account/UserMenu";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth/actions";
import Link from "next/link";
import { ReactNode } from "react";


export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <header className="bg-light-200 justify-between items-center ">
        <div className="bg-light-200 hidden md:flex justify-between items-center max-w-7xl mx-auto py-1">
          <div className="flex items-center gap-4 ml-auto">
            {user ? (
              <>
                <span className="text-sm font-roboto text-dark-900">
                  Hola, <span className="font-medium">{user.name?.split(' ')[0] || 'Usuario'}</span>
                </span>
                <UserMenu user={user} />
              </>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="text-sm font-medium font-roboto text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                >
                  Crear una cuenta
                </Link>
                <span className="text-border">|</span>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium font-roboto text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Navbar />
      {children}
      <CartDrawer />
      <Toaster position="bottom-right" richColors closeButton />
      <Footer />
    </>
  );
}
