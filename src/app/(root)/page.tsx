import { Card } from "@/components";
import FeaturedCategories from "@/components/FeaturedCategories";
import Hero from "@/components/Hero";
import { getAllProducts } from "@/lib/actions/product";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

const Home = async () => {
  const { products } = await getAllProducts({ limit: 4, sort: "newest" });
  const allCategories = await db.select({
    id: categories.id,
    name: categories.name,
    slug: categories.slug
  }).from(categories);
  

  return (
    <main className="mx-auto max-w-auto">
      <Hero />
      <FeaturedCategories categories={allCategories} />
      <section aria-labelledby="latest" className="py-24 px-8">        
        <div className="w-full mx-auto">
          <h2 id="latest" className="text-xs uppercase tracking-[0.3em] text-dark-900  text-center mb-16">
            Lo Último
          </h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {products.map((p) => {

            return (
              <Card
                key={p.id}
                title={p.name}
                imageSrc={p.imageUrl ?? "/shoes/shoe-1.jpg"}
                href={`/products/${p.id}`}
              />
            );
          })}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
