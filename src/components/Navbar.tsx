"use client";

import { formatCategory } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { ShoppingBagIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const SUBCATEGORIES = {
  men: ["jeans", "camisetas", "hoodies"],
  women: ["jeans", "blusas", "vestidos", "hoodies"],
  unisex: [ "hoodies"]
} as const;

const NAV_LINKS = [
  { label: "Hombre", href: "/products?gender=men", hasSubmenu: true, genderValue: "men" },
  { label: "Mujer", href: "/products?gender=women", hasSubmenu: true, genderValue: "women" },
  { label: "Unisex", href: "/products?gender=unisex", hasSubmenu: true, genderValue: "unisex" },
  { label: "Colecciones", href: "/collections", hasSubmenu: false },
  { label: "Contacto", href: "/contact", hasSubmenu: false },
] as const;

const FEATURED_IMAGE = "/featured.jpg";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState(0);

  // Access store methods and state
  const { items, initialize, isInitialized, getItemCount } = useCartStore();

  // Update item count when items change
  useEffect(() => {
    setItemCount(getItemCount());
  }, [items, getItemCount]);

  // Initialize cart on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize().catch(error => {
        console.error('Failed to initialize cart:', error);
      });
    }
  }, [initialize, isInitialized]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm transition-all duration-300" onMouseLeave={() => setActiveSubmenu(null)}>
        <nav className="mx-auto flex h-12 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="AMMAE"
              width={140}
              height={90}
              priority
              className="w-[140px] h-auto sm:w-[190px]"
            />
          </Link>

          <ul className="hidden md:flex items-center gap-8" >
            {NAV_LINKS.map((link) => (
              <li
                key={link.href}
                className="relative group"
                onMouseEnter={() => link.hasSubmenu && setActiveSubmenu(link.genderValue)}
              >
                <Link
                  href={link.href}
                  className="nav-link relative text-sm font-medium font-roboto text-muted-foreground hover:text-foreground transition-colors duration-200 overflow-hidden"
                >
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute inset-0 bg-muted transform scale-x-0 origin-left transition-transform duration-800 hover:scale-x-100" />
                </Link>

                {/* Bridge invisible para mantener hover */}
                {link.hasSubmenu && (
                  <div className="absolute top-full left-0 right-0 h-2 bg-transparent" />
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="flex md:hidden items-center group" aria-label="Sign in">
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground group-hover:scale-105 transition-all duration-200" />
            </Link>
            <Link href="/cart" className="relative flex items-center gap-2 group" aria-label="View cart">
              <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 group-hover:text-gray-900 group-hover:scale-105 group-hover:drop-shadow-sm transition-all duration-200" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium min-w-[16px] sm:min-w-[20px] shadow-sm animate-pulse">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            <button
              className={`md:hidden flex items-end menu-button w-8 h-8 sm:w-10 sm:h-10 ${open ? 'open' : ''}`}
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle menu"
            >
              <div className="menu-burger" />
            </button>
          </div>

        </nav>

        {/* Mega menu */}
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden ${activeSubmenu ? 'opacity-100 translate-y-0 max-h-96' : 'opacity-0 -translate-y-4 max-h-0'}`}>
          {activeSubmenu && (
            <div
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8  backdrop-blur-sm "
              onMouseEnter={() => setActiveSubmenu(activeSubmenu)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-foreground font-roboto mb-4">
                    Coleccion {formatCategory(activeSubmenu)}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {SUBCATEGORIES[activeSubmenu.toLowerCase() as keyof typeof SUBCATEGORIES]?.map((category, index) => (
                      <Link
                        key={category}
                        href={`/products?gender=${activeSubmenu.toLowerCase()}&category=${category}`}
                        className="nav-link relative inline-block text-sm text-muted-foreground font-roboto hover:translate-x-1 hover:text-foreground py-2 transition-all duration-200 ease-[cubic-bezier(0.19,1,0.22,1)]"
                        style={{ transitionDelay: `${index * 50}ms` }}
                      >
                        {formatCategory(category)}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* side pic */}
                <div className="hidden md:block">
                  <div className="bg-muted/50 h-full flex flex-col justify-between">
                    <div className="relative flex-1   aspect-square bg-gradient-to-r from-primary/10 to-accent/10 overflow-hidden">
                      <Image
                        src={FEATURED_IMAGE}
                        alt="Featured product"
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-2 text-base font-medium"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="flex justify-between pt-3 border-t border-border">
                <button className="text-sm font-medium text-muted-foreground">Search</button>
                <Link href="/cart" className="text-sm font-medium text-muted-foreground">
                  Cart ({itemCount})
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
