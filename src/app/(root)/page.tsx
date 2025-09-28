import { Card } from "@/components";
import { getAllProducts } from "@/lib/actions/product";

const Home = async () => {
  const { products } = await getAllProducts({ limit: 3, sort: "newest" });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section aria-labelledby="latest" className="pb-12">
        
        <div className="grid grid-cols-1 gap-6 p-14 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>
    </main>
  );
};

export default Home;
