"use client";

import { setParam } from "@/lib/utils/query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const OPTIONS = [
  { label: "Destacado", value: "featured" },
  { label: "Más reciente", value: "newest" },
  { label: "Precio (Alto → Bajo)", value: "price_desc" },
  { label: "Precio (Bajo → Alto)", value: "price_asc" },
] as const;

export default function Sort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);
  const selected = searchParams.get("sort") ?? "featured";

  const onChange = (value: string) => {//apply sorting mechanism
    const withSort = setParam(pathname, search, "sort", value);
    const withPageReset = setParam(pathname, new URL(withSort, "http://dummy").search, "page", "1");
    router.push(withPageReset, { scroll: false });
  };

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-[12px] md:text-sm text-dark-900 font-roboto">Ordenar por</span>
      <select
        className=" bg-light-100 px-3 py-2 font-light text-[12px] md:text-sm font-roboto"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort products"
      >
        {OPTIONS.map((o) => (//select different sorting options
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
