import { CATEGORY_VISUALS } from "@/constats";
import Image from "next/image";
import Link from "next/link";

interface FeaturedCategoriesProps {
    categories?: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
    // Filtrar solo categorías con configuración visual
    const featuredCategories = categories?.filter(
        cat => Object.keys(CATEGORY_VISUALS).includes(cat.slug)
    ) || [];

    if (featuredCategories.length === 0) return null;

    return (
        <section className="relative py-20  text-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-0">
                <h2 className="text-[11px] uppercase tracking-[0.25em] text-center text-dark-900 mb-14">
                    Explorar por categoría
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {featuredCategories.map((category, index) => {
                        const visual = CATEGORY_VISUALS[category.slug as keyof typeof CATEGORY_VISUALS];
                        const heightClass ="h-[600px] lg:h-[700px] md:col-span-2"
                          
                        return (
                            <Link
                                key={category.id}
                                href={`/products?category=${category.slug}`}
                                className={`group relative ${heightClass} overflow-hidden cursor-pointer`}
                                aria-label={`Explorar categoría ${visual.title}`}
                            >
                                <Image
                                    src={visual.image}
                                    alt={visual.title}
                                    fill
                                    className="object-fit transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                />
                                <div
                                    className={`absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t ${visual.color} to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-700`}
                                ></div>
                                <div className="absolute inset-0 flex flex-col justify-end p-6 transition-transform duration-700 ease-out group-hover:translate-y-[-6px]">
                                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2 opacity-70">
                                        {visual.description}
                                    </p>
                                    <h3 className="text-2xl lg:text-3xl font-light mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                                        {visual.title}
                                    </h3>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                        <span className="text-xs">Descubrir</span>
                                        <svg className="w-4 h-4 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>

    );
}