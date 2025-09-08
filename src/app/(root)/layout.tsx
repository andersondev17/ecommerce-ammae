import { Footer, Navbar } from "@/components";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="bg-light-200 hidden md:flex justify-between items-center py-2 px-4">
        <div>
          {/*izquierda del header */}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-up"
            className="text-sm font-medium text-gray-900 hover:text-gray-600"
          >
            Join Us
          </Link>
          <span>|</span>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-900 hover:text-gray-600"
          >
            Sign In
          </Link>
        </div>
      </header>
      <Navbar />
      {children}
      <Toaster position="bottom-right" richColors closeButton />
      <Footer />
    </>
  );
}
