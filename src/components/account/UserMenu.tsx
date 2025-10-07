"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface UserMenuProps {
    user: {
        name?: string | null;
        email: string;
        image?: string | null;
        createdAt?: Date;
    };
    variant?: "default" | "navbar";
}

const MENU_ITEMS = [
    { label: "Mi Perfil", href: "/account" },
    { label: "Mis Pedidos", href: "/account?tab=orders" },
    { label: "Mis Direcciones", href: "/account?tab=addresses" },
] as const;

export default function UserMenu({ user, variant = "default" }: UserMenuProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleSignOut = () => {
        startTransition(async () => {
            try {
                await signOut();
                router.push("/");
            } catch {
                toast.error("Error al cerrar sesión");
            }
        });
    };

    const initials = user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || user.email[0].toUpperCase();

    const sizeClasses = variant === "navbar"
        ? "h-9 w-9 sm:h-10 sm:w-10"
        : "h-9 w-9";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="group relative focus:outline-none"
                    disabled={isPending}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-dark-500/40 to-dark-700/40 blur-sm group-hover:blur-md transition-all duration-300" />

                    <div className="relative ring-2 ring-dark-500/60 rounded-full 
                                    group-hover:ring-dark-400 group-hover:scale-105 
                                    group-active:scale-95
                                    focus-visible:ring-dark-300 focus-visible:ring-offset-2 focus-visible:ring-offset-light-100
                                    transition-all duration-200 ease-out">
                        <Avatar className={sizeClasses}>
                            <AvatarImage src={user.image || undefined} alt={`Foto de perfil de ${user.name || user.email}`} className="object-cover" />
                            <AvatarFallback className="bg-dark-900 text-light-100 text-xs font-roboto font-medium">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
                {MENU_ITEMS.map(({ label, href }) => (
                    <DropdownMenuItem
                        key={href}
                        onClick={() => router.push(href)}
                        className="cursor-pointer font-roboto text-sm text-dark-900 tracking-wide font-light"
                    >
                        {label}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red hover:text-red font-roboto flex justify-between items-center tracking-wide font-light"
                    disabled={isPending}
                >
                    <span>{isPending ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
                    <LogOut className="h-4 w-4" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}