"use client";

import { formatCategory } from "@/lib/utils";
import { getArrayParam, removeParams, toggleArrayParam } from "@/lib/utils/query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { IoFilter } from "react-icons/io5";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

const GENDERS = ["men", "women", "unisex"] as const;
const SIZES = [
  "XS", "S", "M", "L", "XL",
  "7", "8", "9", "10", "11", "12",
  "onesize"
] as const;
const COLORS = ["black", "white", "red", "green", "blue", "grey", "pink", "navy"] as const;
const PRICES = [
  { id: "0-50", label: "$0 - $50" },
  { id: "50-100", label: "$50 - $100" },
  { id: "100-150", label: "$100 - $150" },
  { id: "150-", label: "Over $150" },
] as const;
const CATEGORIES = [
  "jeans", "blusas", "vestidos",
  "Camisetas", "perfumes"
] as const;

type GroupKey = "gender" | "size" | "color" | "price" | "category";

export default function Filters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);

  const [expanded, setExpanded] = useState<Record<GroupKey, boolean>>({
    gender: true,
    size: false,
    color: false,
    price: false,
    category: false,
  });

  const activeCounts = {
    gender: getArrayParam(search, "gender").length,
    size: getArrayParam(search, "size").length,
    color: getArrayParam(search, "color").length,
    price: getArrayParam(search, "price").length,
    category: getArrayParam(search, "category").length,
  };

  const onToggle = (key: GroupKey, value: string) => {//push new url to update selected filter 
    const url = toggleArrayParam(pathname, search, key, value);
    router.push(url, { scroll: false });
  };

  const clearAll = () => {
    const url = removeParams(pathname, search, ["gender", "size", "color", "price", "category", "page"]);
    router.push(url, { scroll: false });
  };

  const Group = ({ title, children, k }: { title: string; children: React.ReactNode; k: GroupKey }) => (
    <div className="border-b border-light-200 py-6">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded((s) => ({ ...s, [k]: !s[k] }))}
      >
        <span className="text-base font-medium text-dark-900">{title}</span>
        <span className="text-dark-500">
          {expanded[k] ? "−" : "+"}
        </span>
      </button>

      {expanded[k] && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <Sheet>
      <div className="flex items-center justify-between">
        <SheetTrigger asChild>
          <button className="flex items-center gap-2  px-0   md:px-4 py-2 text-[12px] md:text-sm font-roboto transition-colors hover:text-light-50">
            Filtros 
            <IoFilter size={16} />
          </button>
        </SheetTrigger>
      </div>

      <SheetContent side="left" className="w-[400px] sm:w-[400px] bg-white p-0">
        <SheetHeader className="px-6 py-4 border-b border-light-200 flex flex-row items-center justify-between">
          <SheetTitle className="text-base font-medium">Filtros</SheetTitle>
          {Object.values(activeCounts).some(count => count > 0) && (
            <button
              onClick={clearAll}
              className="text-sm text-dark-600 hover:text-dark-900 underline font-roboto-slab pt-4"
            >
              Limpiar filtros
            </button>
          )}
        </SheetHeader>

        <div className="px-6 py-2 space-y-0 max-h-[calc(100vh-160px)] overflow-y-auto">

          <Group title={`Categoria ${activeCounts.category ? `(${activeCounts.category})` : ""}`} k="category">
            <ul className="space-y-3">
              {CATEGORIES.map((cat) => {
                const checked = getArrayParam(search, "category").includes(cat);
                return (
                  <li key={cat}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-dark-300 text-dark-900 focus:ring-dark-900 focus:ring-1"
                        checked={checked}
                        onChange={() => onToggle("category", cat)}
                      />
                      <span className="text-sm text-dark-700 group-hover:text-dark-900 transition-colors p-2">
                        {formatCategory(cat)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Group>

          <Group title={`Genero ${activeCounts.gender ? `(${activeCounts.gender})` : ""}`} k="gender">
            <ul className="space-y-3">
              {GENDERS.map((g) => {
                const checked = getArrayParam(search, "gender").includes(g);
                return (
                  <li key={g}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-dark-300 text-dark-900 focus:ring-dark-900 focus:ring-1"
                        checked={checked}
                        onChange={() => onToggle("gender", g)}
                      />
                      <span className="text-sm text-dark-700 group-hover:text-dark-900 transition-colors">
                        {g[0].toUpperCase() + g.slice(1)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Group>

          <Group title={`Talla ${activeCounts.size ? `(${activeCounts.size})` : ""}`} k="size">
            <ul className="grid grid-cols-5 gap-2">
              {SIZES.map((s) => {
                const checked = getArrayParam(search, "size").includes(s);
                return (
                  <li key={s}>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-dark-900"
                        checked={checked}
                        onChange={() => onToggle("size", s)}
                      />
                      <span className="text-body font-roboto">{s}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Group>

          <Group title={`Color ${activeCounts.color ? `(${activeCounts.color})` : ""}`} k="color">
            <ul className="grid grid-cols-2 gap-2">
              {COLORS.map((c) => {
                const checked = getArrayParam(search, "color").includes(c);
                return (
                  <li key={c} className="flex items-center gap-2">
                    <input
                      id={`color-${c}`}
                      type="checkbox"
                      className="h-4 w-4 accent-dark-900"
                      checked={checked}
                      onChange={() => onToggle("color", c)}
                    />
                    <label htmlFor={`color-${c}`} className="text-body capitalize font-roboto">
                      {c}
                    </label>
                  </li>
                );
              })}
            </ul>
          </Group>

          <Group title={`Precio ${activeCounts.price ? `(${activeCounts.price})` : ""}`} k="price">
            <ul className="space-y-2">
              {PRICES.map((p) => {
                const checked = getArrayParam(search, "price").includes(p.id);
                return (
                  <li key={p.id} className="flex items-center gap-2">
                    <input
                      id={`price-${p.id}`}
                      type="checkbox"
                      className="h-4 w-4 accent-dark-900"
                      checked={checked}
                      onChange={() => onToggle("price", p.id)}
                    />
                    <label htmlFor={`price-${p.id}`} className="text-body font-roboto">
                      {p.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </Group>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-light-200">
          <SheetTrigger asChild>
            <button className="w-full bg-dark-900 text-white py-3 rounded-full font-medium hover:bg-dark-800 transition-colors">
              Show Products
            </button>
            
          </SheetTrigger>
        </div>
      </SheetContent>

    </Sheet>
  );
}
