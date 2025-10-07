// components/user-section.tsx
"use client";

import { getCurrentUser } from "@/lib/auth/actions";
import { UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import UserMenu from "./account/UserMenu";

interface UserSectionProps {
    navClasses: {
        text: string;
        icon: string;
    };
}

export default function UserSection({ navClasses }: UserSectionProps) {
    const [user, setUser] = useState<{
        id: string;
        email: string;
        name?: string | null;
        image?: string | null
    } | null>(null);

    useEffect(() => {
        getCurrentUser().then(setUser).catch(() => setUser(null));
    }, []);

    return (
        <section className="flex items-center gap-4">
            {user ? (
                <>
                    <span className={` hidden md:inline-block text-sm font-roboto transition-colors duration-200 ${navClasses.text} group-hover/nav:text-foreground`}>
                        Hola, <span className="font-medium">{user.name?.split(' ')[0] || 'Usuario'}</span>
                    </span>
                    <UserMenu user={user} />
                </>
            ) : (
                <>
                    <Link
                        href="/sign-in"
                        className={`text-sm font-medium font-roboto tracking-wide transition-colors duration-200 ${navClasses.text} group-hover/nav:text-foreground`}
                    >
                        <UserIcon className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${navClasses.icon} group-hover/nav:text-gray-700`} />
                    </Link>
                </>
            )}
        </section>
    );
}