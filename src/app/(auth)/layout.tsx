import Image from "next/image";
import Link from "next/link";
import { ReactNode, Suspense } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-dark-900 text-light-100 p-6 xl:p-10">
        <div className="flex items-center">
          <div className="h-10 w-40 rounded-md bg-orange inline-flex items-center justify-center">
            <Link href="/">
              <Image src="/logo.png" alt="AMMAE logo" width={200} height={90} className="object-contain" priority />
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-heading-2 font-fugaz tracking-tight">Únete Ahora</h2>
          <p className="max-w-md text-lead text-light-300 font-roboto leading-relaxed">
            Unete y descubre moda femenina exclusiva diseñada para la mujer moderna que valora estilo y calidad.
          </p>
          <div className="flex gap-2" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-light-100/90 transition-opacity" />
            <span className="h-2 w-2 rounded-full bg-light-100/50 transition-opacity" />
            <span className="h-2 w-2 rounded-full bg-light-100/50 transition-opacity" />
          </div>
        </div>

        <p className="text-footnote text-light-400 font-roboto">© {new Date().getFullYear()} AMMAE. Todos los derechos reservados.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="h-96 animate-pulse bg-light-100 rounded-xl" />}>
            {children}
          </Suspense>
        </div>
      </section>
    </main>
  );
}
