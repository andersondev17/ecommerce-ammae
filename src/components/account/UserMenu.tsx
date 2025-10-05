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
            } catch (error) {
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

    const iconClasses = variant === "navbar"
        ? "h-4 w-4 sm:h-8 sm:w-5"
        : "h-4 w-4";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500 rounded-full"
                    disabled={isPending}
                >
                    <Avatar className={iconClasses}>
                        <AvatarImage src={user.image || undefined} alt={`Foto de perfil de ${user.name || user.email}`} />
                        <AvatarFallback className="bg-dark-900 text-light-100 text-xs font-roboto">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
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