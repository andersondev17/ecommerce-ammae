import Image from "next/image";
import Link from "next/link";

interface HeroProps {
    title?: string;
    subtitle?: string;
    cta?: { text: string; href: string };
    imageSrc?: string;
}

export default function Hero({
    title = "Nueva Colección",
    subtitle = "Descubre estilo que perdura",
    cta = { text: "Explorar", href: "/products" },
    imageSrc = "/hero.avif"
}: HeroProps) {
    return (
        <section className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden -mt-16">
            <Image
                src={imageSrc}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
            />

            <div className="absolute inset-0 buttom-0 bg-gradient-to-b from-black/40 to-black/20" />

            <div className="relative h-full flex items-center justify-center text-center px-4">
                <div className="max-w-3xl space-y-6">
                    <p className="text-xs tracking-[0.35em] uppercase text-white/60 font-light">
                        {subtitle}
                    </p>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[0.95]">
                        {title}
                    </h1>
                    <Link
                        href={cta.href}
                        className="inline-block text-base text-white border-b border-white hover:border-white transition-colors pb-1"
                    >
                        {cta.text}
                    </Link>
                </div>
            </div>
        </section>
    );
}