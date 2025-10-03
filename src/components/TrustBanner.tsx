import Image from "next/image";

export function TrustBanner() {
    return (
        <aside 
            className="flex items-stretch bg-white rounded-lg md:rounded-lg shadow-sm sm:shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            aria-label="Política de devoluciones"
        >
            {/* Logo container */}
            <div 
                className="flex-shrink-0 w-16 sm:w-20 lg:w-24 bg-dark-900 flex items-center justify-center"
                aria-hidden="true"
            >
                <div className="relative w-20 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                    <Image
                        src="/logo.png" 
                        alt=""
                        width={48}
                        height={48}
                        className="object-contain brightness-0 invert"
                        sizes="(max-width: 640px) 40px, 48px"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 flex items-center">
                <p className="text-xs sm:text-base text-dark-900 font-light tracking-wide font-roboto leading-relaxed">
                    Hasta 30 días para cambios
                </p>
            </div>
        </aside>
    );
}