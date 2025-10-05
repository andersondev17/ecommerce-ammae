import { Card } from "@/components";
import Hero from "@/components/Hero";
import { getAllProducts } from "@/lib/actions/product";

const Home = async () => {
  const { products } = await getAllProducts({ limit: 3, sort: "newest" });

  return (
    <main className="mx-auto max-w-auto">
      <Hero />
      <section aria-labelledby="latest" className="py-24 px-8">        
        <div className="max-w-7xl mx-auto">
          <h2 id="latest" className="text-3xl font-light tracking-tight text-dark-900 mb-16">
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
