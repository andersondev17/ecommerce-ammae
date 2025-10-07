import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Contáctanos",
    links: [
      { label: "(+57) 301 350 1627", href: "tel:+573013501627" },
      { label: "(+57) 318 904 6370", href: "tel:+573189046370" },
    ],
  },
  {
    title: "Nosotros",
    links: [
      { label: "Quiénes somos", href: "/legal?tab=about" },
      { label: "Política de privacidad", href: "/legal?tab=privacy" },
      { label: "Términos del servicio", href: "/legal?tab=terms" },
    ],
  },
] as const;

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-light-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
          {/* Logo */}
          <div className="flex items-start md:col-span-3">
            <Image
              src="/logo.png"
              className="invert"
              alt="AMMAE"
              width={120}
              height={90}
            />
          </div>

          {/* Columnas */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-7">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-heading-3 font-roboto-slab">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-body font-roboto text-light-400 hover:text-light-300 transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Redes sociales */}
          <div className="flex gap-4 md:col-span-2 md:justify-end">
            {[
              { src: "/x.svg", alt: "X", href: "https://twitter.com" },
              { src: "/facebook.svg", alt: "Facebook", href: "https://facebook.com" },
              { src: "/instagram.svg", alt: "Instagram", href: "https://instagram.com" },
            ].map((s) => (
              <Link
                key={s.alt}
                href={s.href}
                aria-label={s.alt}
                target="_blank"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-light-100"
              >
                <Image src={s.src} alt={s.alt} width={18} height={18} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Parte inferior */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-4 text-light-400 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-caption">
            <Image src="/globe.svg" alt="" width={16} height={16} />
            <span>COL</span>
            <span className="font-roboto">
              © {new Date().getFullYear()} AMMAE, All rights reserved
            </span>
          </div>

          <ul className="flex items-center gap-6 text-caption font-roboto">
            <li>
              <Link href="/legal/terms">Términos de Uso</Link>
            </li>
            <li>
              <Link href="/legal/privacy">Política de Privacidad</Link>
            </li>
            <li>
              <Link href="/legal/about">Nosotros</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
