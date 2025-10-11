import { Card } from "@/components";
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import { getAllProducts } from "@/lib/actions/product";
import { parseFilterParams } from "@/lib/utils/query";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const categories = sp.category ? (Array.isArray(sp.category) ? sp.category : [sp.category]) : [];
  const title = categories.length ? `Productos de ${categories.join(", ")}` : "Todos los productos";
  const description = categories.length
    ? `Descubre nuestros productos de ${categories.join(", ")}. Filtra por talla, color y precio.`
    : "Lo último en moda para dama y hombre. Descubre todos nuestros productos.";

  return { title, description };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const parsed = parseFilterParams(sp);
  const { products, totalCount } = await getAllProducts(parsed);

  const activeBadges: string[] = [];
  (sp.gender ? (Array.isArray(sp.gender) ? sp.gender : [sp.gender]) : []).forEach((g) =>
    activeBadges.push(String(g)[0].toUpperCase() + String(g).slice(1))
  );
  (sp.size ? (Array.isArray(sp.size) ? sp.size : [sp.size]) : []).forEach((s) => activeBadges.push(`Talla: ${s}`));
  (sp.color ? (Array.isArray(sp.color) ? sp.color : [sp.color]) : []).forEach((c) =>
    activeBadges.push(String(c)[0].toUpperCase() + String(c).slice(1))
  );
  (sp.price ? (Array.isArray(sp.price) ? sp.price : [sp.price]) : []).forEach((p) => {
    const [min, max] = String(p).split("-");
    const label = min && max ? `$${min} - $${max}` : min && !max ? `Over $${min}` : `$0 - $${max}`;
    activeBadges.push(label);
  });

  return (
    <main className="mx-auto max-w-auto ">
      <header className="py-6 text-center">
        <h2 className="text-base font-light text-dark-900 font-roboto-slab mb-4">
          {totalCount} Nuevos productos
        </h2>
        <p className="text-sm text-dark-700 font-light font-roboto max-w-2xl mx-auto">
          Cada pieza cuenta una historia de elegancia atemporal.
        </p>
      </header>


      {activeBadges.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2 p-8">
          {activeBadges.map((b, i) => (
            <li
              key={`${b}-${i}`}
              className="rounded-full border border-light-300 px-3 py-1 text-caption text-dark-900 font-roboto p-4"
            >
              {b}
            </li>
          ))}
        </ul>
      )}

      <div className="sticky top-10 md:top-16 z-20 bg-white/98 backdrop-blur-md py-4 px-8">
        <div className="flex items-center justify-between">
          <Filters />
          <Sort />
        </div>
      </div>

      <section className="relative">
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="rounded-lg border border-light-300 p-8 text-center">
              <p className="text-body text-dark-700 font-roboto"> No se pudieron encontrar resultados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 pb-6 border">
              {products.map((p) => {
                const price =
                  p.minPrice !== null && p.maxPrice !== null && p.minPrice !== p.maxPrice
                    ? `$${p.minPrice} - $${p.maxPrice}`
                    : p.minPrice !== null
                      ? p.minPrice
                      : undefined;
                return (
                  <Card
                    key={p.id}
                    title={p.name}
                    subtitle={p.subtitle ?? undefined}
                    imageSrc={p.imageUrl ?? "/shoes/shoe-1.jpg"}
                    imageAlt={p.name}
                    price={price}
                    href={`/products/${p.id}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
