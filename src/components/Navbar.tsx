"use client";

import { useCartStore } from "@/store/cart.store";
import { ShoppingBagIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const SUBCATEGORIES = {
  men: ["shoes", "jeans", "camisetas", "hoodies", "accesorios"],
  women: ["shoes", "jeans", "blusas", "vestidos", "hoodies", "accesorios"],
  unisex: ["shoes", "hoodies", "accesorios"]
} as const;

const NAV_LINKS = [
  { label: "Men", href: "/products?gender=men", hasSubmenu: true },
  { label: "Women", href: "/products?gender=women", hasSubmenu: true },
  { label: "Unisex", href: "/products?gender=unisex", hasSubmenu: true },
  { label: "Collections", href: "/collections", hasSubmenu: false },
  { label: "Contact", href: "/contact", hasSubmenu: false },
] as const;

const formatCategory = (cat: string): string => {
  const labels: Record<string, string> = {
    shoes: "Shoes", jeans: "Jeans", blusas: "Blusas",
    vestidos: "Vestidos", camisetas: "Camisetas",
    hoodies: "Hoodies", accesorios: "Accesorios"
  };
  return labels[cat] || cat;
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="AMMAE" width={80} height={60} priority className="invert" />
          </Link>

          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className="nav-link relative text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                >
                  {link.label}
                </Link>

                {link.hasSubmenu && (
                  <div className="absolute top-full left-0 w-48 mt-2 p-4 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <h3 className="text-sm font-semibold mb-3">Shop {link.label}</h3>
                    <div className="space-y-1">
                      {SUBCATEGORIES[link.label.toLowerCase() as keyof typeof SUBCATEGORIES]?.map((category) => (
                        <Link
                          key={category}
                          href={`/products?gender=${link.label.toLowerCase()}&category=${category}`}
                          className="block text-sm text-gray-600 hover:text-gray-900 py-1"
                        >
                          {formatCategory(category)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="relative flex items-center gap-2" aria-label="View cart">
              <ShoppingBagIcon className="h-5 w-5 text-gray-900 hover:text-gray-600 transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            <button
              className={`md:hidden flex items-end menu-button ${open ? 'open' : ''}`}
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle menu"
            >
              <div className="menu-burger" />
            </button>
          </div>

        </nav>

        {open && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <div key={link.href}>
                  {link.hasSubmenu ? (
                    <>
                      <button
                        className="flex w-full items-center justify-between py-2 text-left text-base font-medium"
                        onClick={() => setMobileSubmenu(
                          mobileSubmenu === link.label.toLowerCase() ? null : link.label.toLowerCase()
                        )}
                      >
                        {link.label}
                        <span>{mobileSubmenu === link.label.toLowerCase() ? '−' : '+'}</span>
                      </button>

                      {mobileSubmenu === link.label.toLowerCase() && (
                        <div className="ml-4 space-y-1 border-l border-gray-200 pl-3">
                          {SUBCATEGORIES[link.label.toLowerCase() as keyof typeof SUBCATEGORIES]?.map((category) => (
                            <Link
                              key={category}
                              href={`/products?gender=${link.label.toLowerCase()}&category=${category}`}
                              className="block py-1 text-sm text-gray-600"
                              onClick={() => setOpen(false)}
                            >
                              {formatCategory(category)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      className="block py-2 text-base font-medium"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}

              <div className="flex justify-between pt-3 border-t border-gray-100">
                <button className="text-sm font-medium">Search</button>
                <Link
                  href="/cart"
                  className="text-sm font-medium"
                  onClick={() => setOpen(false)}
                >
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
