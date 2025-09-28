import Image from "next/image";
import Link from "next/link";

export type BadgeTone = "red" | "green" | "orange";

export interface CardProps {
  title: string;
  description?: string;
  subtitle?: string;
  meta?: string | string[];
  imageSrc: string;
  imageAlt?: string;
  price?: string | number;
  href?: string;
  badge?: { label: string; tone?: BadgeTone };
  className?: string;
}

export default function Card({
  title,
  description,
  subtitle,
  meta,
  imageSrc,
  imageAlt = title,
  price,
  href,
  className = "",
}: CardProps) {
  const displayPrice =
    price === undefined ? undefined : typeof price === "number" ? `$${price}` : price;

  const isVideo = /\.(mp4|webm|ogg)$/i.test(imageSrc);

  const content = (
    <article className={`group bg-white overflow-hidden h-full flex flex-col ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-light-200 transition-all duration-300 group-hover:shadow-lg">
        {isVideo ? (
          <video
            src={imageSrc}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            autoPlay
            muted
            loop
            playsInline
            aria-label="Product video"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 1024px) 240px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            aria-label="Product image"
          />
        )}
      </div>
      <div className="p-4 flex-1">
        <h3 className="text-sm font-light tracking-wide font-roboto-slab text-dark-900 mb-1 group-hover:text-dark-700 transition-colors leading-tight">
          {title}
        </h3>
        <div className="transition-all duration-300 group-hover:opacity-0 group-hover:max-h-0 group-hover:overflow-hidden">

          {subtitle && <p className="text-[9px] uppercase tracking-[0.25em] text-dark-400 font-light font-roboto mb-0.5">{subtitle}</p>}
          {description && <p className="text-xs md:text-base text-dark-700 font-roboto line-clamp-1">{description}</p>}

          {meta && (
            <p className="text-xs text-dark-500 line-clamp-1 mt-1">
              {Array.isArray(meta) ? meta.join(" • ") : meta}
            </p>
          )}
        </div>
        {displayPrice && (
          <p className="text-xs md:text-sm text-dark">
            {displayPrice}
          </p>
        )}
      </div>
    </article>
  );

  return href ? (
    <Link
      href={href}
      aria-label={title}
      className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
    >
      {content}
    </Link>
  ) : (
    content
  );
}