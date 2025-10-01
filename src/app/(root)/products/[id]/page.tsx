import { Card, CollapsibleSection, ProductGallery } from "@/components";
import ProductActions from "@/components/ProductActions";
import { getProduct, getProductReviews, getRecommendedProducts, type RecommendedProduct, type Review } from "@/lib/actions/product";
import { formatCategory } from "@/lib/utils";
import { Star } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type GalleryVariant = { color: string; images: string[] };

export const metadata: Metadata = {
  title: "Product Details",
  description: "View product details and add to cart",
};
function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) return undefined;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function NotFoundBlock() {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-light-300 bg-light-100 p-8 text-center">
      <h1 className="text-heading-3 text-dark-900 font-roboto">Product not found</h1>
      <p className="mt-2 text-body text-dark-700 font-roboto">The product you’re looking for doesn’t exist or may have been removed.</p>
      <div className="mt-6">
        <Link
          href="/products"
          className="inline-block rounded-full font-roboto bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
        >
          Buscar Productos
        </Link>
      </div>
    </section>
  );
}

async function ReviewsSection({ productId }: { productId: string }) {
  const reviews: Review[] = await getProductReviews(productId);
  const count = reviews.length;
  const avg =
    count > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / count) : 0;

  return (
    <CollapsibleSection className="font-roboto text-sm"
      title={`Reviews (${count})`}
      rightMeta={
        <span className="flex items-center gap-1 text-dark-900">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`h-4 w-4 ${i <= Math.round(avg) ? "fill-[--color-dark-900]" : ""}`} />
          ))}
        </span>
      }
    >
      {reviews.length === 0 ? (
        <p className="text-sm font-roboto">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.slice(0, 10).map((r) => (
            <li key={r.id} className="rounded-lg border border-light-300 p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-body-medium text-dark-900 font-roboto">{r.author}</p>
                <span className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-[--color-dark-900]" : ""}`} />
                  ))}
                </span>
              </div>
              {r.title && <p className="text-body-medium text-dark-900">{r.title}</p>}
              {r.content && <p className="mt-1 line-clamp-[8] text-body text-dark-700">{r.content}</p>}
              <p className="mt-2 text-caption text-dark-700">{new Date(r.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}

async function AlsoLikeSection({ productId }: { productId: string }) {
  const recs: RecommendedProduct[] = await getRecommendedProducts(productId);
  if (!recs.length) return null;
  return (
    <section className="mt-16">
      <h2 className="mb-6 text-heading-3 text-dark-900 font-roboto">You Might Also Like</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 ">
        {recs.map((p) => (
          <Card
            key={p.id}
            title={p.title}
            imageSrc={p.imageUrl}
            price={p.price ?? undefined}
            href={`/products/${p.id}`}
          />
        ))}
      </div>
    </section>
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProduct(id);

  if (!data) {
    return (
      notFound()
    )
  }

  const { product, variants, images } = data;

  const galleryVariants: GalleryVariant[] = variants.map((v) => {
    const imgs = images
      .filter((img) => img.variantId === v.id)
      .map((img) => img.url);

    const fallback = images
      .filter((img) => img.variantId === null)
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      })
      .map((img) => img.url);

    return {
      color: v.color?.name || "Default",
      images: imgs.length ? imgs : fallback,
    };
  }).filter((gv) => gv.images.length > 0);

  const defaultVariant =
    variants.find((v) => v.id === product.defaultVariantId) || variants[0];

  const basePrice = defaultVariant ? Number(defaultVariant.price) : null;
  const salePrice = defaultVariant?.salePrice ? Number(defaultVariant.salePrice) : null;

  const displayPrice = salePrice !== null && !Number.isNaN(salePrice) ? salePrice : basePrice;
  const compareAt = salePrice !== null && !Number.isNaN(salePrice) ? basePrice : null;

  const discount =
    compareAt && displayPrice && compareAt > displayPrice
      ? Math.round(((compareAt - displayPrice) / compareAt) * 100)
      : null;

  const subtitle =
    product.gender?.label ? `${product.category?.name}  de ${formatCategory(product.gender.label)} ` : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="py-4 text-xs tracking-wide text-dark-500">
        <Link href="/" className="hover:underline font-roboto-slab">Home</Link> / <Link href="/products" className="hover:underline font-roboto-slab">Products</Link> /{" "}
        <span className="text-dark-700 font-roboto-slab">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_480px]">
        {galleryVariants.length > 0 && (
          <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
            <ProductGallery productId={product.id} variants={galleryVariants} className="w-full h-screen lg:h-9/12" />
          </div>
        )}

        <div className="flex flex-col gap-4 px-4 sm:px-6 lg:px-14 py-6 lg:py-4 max-w-md">
          <header className="flex flex-col gap-0.5 mb-1">
            <p className="text-[11px] uppercase  text-dark-900 font-light font-roboto-slab mb-4">
              REF: {product.id.slice(-6).toUpperCase()}
            </p>
            {subtitle && <p className="text-[11px] uppercase tracking-[0.2em] text-dark-700 font-light font-roboto">{subtitle}</p>}
            <h1 className="text-3xl font-light tracking-wide  font-roboto-slab">{product.name}</h1>
            <div className="flex items-center ">
              <p className="text-[13px] uppercase tracking-[0.1em] font-light text-dark-900 font-roboto-slab">{formatPrice(displayPrice)}</p>
              {compareAt && (
                <>
                  <span className="text-base text-dark-700 line-through font-roboto-slab">{formatPrice(compareAt)}</span>
                  {discount !== null && (
                    <span className="rounded-full border border-light-300 px-2 py-0.5 text-caption text-[--color-green] font-roboto uppercase">
                      {discount}% off
                    </span>
                  )}
                </>
              )}
            </div>
          </header>


          <ProductActions
            productId={product.id}
            variants={variants}
            galleryVariants={galleryVariants}
            defaultVariantId={product.defaultVariantId}
          />

          <CollapsibleSection className="font-roboto text-sm" title="Detalles del producto" defaultOpen>
            <div className="space-y-3">
              {product.description.includes('.') ? (
                <div className="space-y-2">
                  {product.description
                    .split('.')
                    .filter(sentence => sentence.trim())
                    .map((sentence, index) => (
                      <p key={index} className="text-sm font-roboto">
                        • {sentence.trim()}.
                      </p>
                    ))
                  }
                </div>
              ) : (
                <p>
                  {product.description}
                </p>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection className="font-roboto text-sm" title="Envios y devoluciones">
            <p className="font-roboto text-sm"> Despues de realizar tu compra, el tiempo estimado de entrega es de aproximadamente 3 a 4 días hábiles.</p>
          </CollapsibleSection>

          <Suspense
            fallback={
              <CollapsibleSection className="font-roboto text-sm" title="Comentarios">
                <p className="text-sm text-dark-500 font-roboto">Cargando comentarios...</p>
              </CollapsibleSection>
            }
          >
            <ReviewsSection productId={product.id} />
          </Suspense>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="mt-16">
            <h2 className="mb-6 text-heading-3 text-dark-900 font-roboto">You Might Also Like</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-light-200" />
              ))}
            </div>
          </section>
        }
      >
        <AlsoLikeSection productId={product.id} />
      </Suspense>
    </main>
  );
}
