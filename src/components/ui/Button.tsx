import { cn } from "@/lib/utils";
import Link from "next/link";

type ButtonProps = {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    variant?: "primary" | "secondary";
    size?: "sm" | "md";
    fullWidth?: boolean;
    type?: "button" | "submit" | "reset";
    ariaLabel?: string;
};

export function Button({
    children,
    href,
    onClick,
    disabled,
    isLoading,
    variant = "primary",
    size = "md",
    fullWidth = false,
    type = "button",
    ariaLabel,
}: ButtonProps) {
    const baseStyles =
        "flex items-center justify-center tracking-wide font-roboto-slab rounded-full border-2 text-body-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizes = {
        sm: "py-2 px-4 text-xs",
        md: "py-2 md:py-3 px-6 text-sm",
    };

    const variants = {
        primary:
            "bg-dark-900 border-dark-900 text-light-100 hover:bg-light-100 hover:text-dark-900 focus-visible:ring-[--color-dark-500]",
        secondary:
            "bg-light-100 border-dark-900 text-dark-900 hover:ring-2 hover:ring-dark-900  focus-visible:ring-[--color-dark-500]",
    };

    const className = cn(
        baseStyles,
        sizes[size],
        variants[variant],
        fullWidth && "w-full"
    );

    if (href) {
        return (
            <Link href={href} className={className} aria-label={ariaLabel}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={className}
            aria-busy={isLoading}
            aria-label={ariaLabel}
        >
            {isLoading ? "Cargando..." : children}
        </button>
    );
}
