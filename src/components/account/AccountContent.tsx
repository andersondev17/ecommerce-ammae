"use client";

import { AddressManager } from "@/components/checkout/AddressManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { Package } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Order {
    id: string;
    status: string;
    totalAmount: string;
    createdAt: Date;
}

interface Address {
    id: string;
    userId: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    type: "shipping" | "billing";
    isDefault: boolean;
}

interface AccountContentProps {
    user: {
        name?: string | null;
        email: string;
        image?: string | null;
        createdAt?: Date;
    };
    initialOrders: Order[];
    initialAddresses: Address[];
}

type Tab = "profile" | "orders" | "addresses";

const STATUS_CONFIG = {
    pending: { color: "bg-orange/10 text-orange", label: "Pendiente" },
    paid: { color: "bg-green/10 text-green", label: "Pagado" },
    shipped: { color: "bg-blue-500/10 text-blue-500", label: "Enviado" },
    delivered: { color: "bg-green/10 text-green", label: "Entregado" },
    cancelled: { color: "bg-red/10 text-red", label: "Cancelado" },
} as const;

const TABS = [
    { value: "profile" as const, label: "Perfil" },
    { value: "orders" as const, label: "Pedidos" },
    { value: "addresses" as const, label: "Direcciones" },
] as const;

const LABEL_CLASS = "text-[10px] uppercase tracking-[0.2em] text-dark-700 block mb-2 font-roboto font-light";
const TAB_CLASS = "relative pb-2.5 px-0 text-xs sm:text-sm uppercase tracking-[0.15em] font-light text-dark-500 data-[state=active]:text-dark-900 data-[state=active]:font-normal border-b-2 border-transparent data-[state=active]:border-dark-900 transition-all duration-300 hover:text-dark-700";
const VALID_TABS = ["profile", "orders", "addresses"] as const;

const formatMemberSince = (date?: Date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric",
    });
};

export default function AccountContent({ user, initialOrders, initialAddresses }: AccountContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const isValidTab = (tab: string | null): tab is Tab =>
        tab !== null && VALID_TABS.includes(tab as Tab);

    useEffect(() => {
        if (isValidTab(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const handleTabChange = (tab: string) => {
        const newTab = tab as Tab;
        setActiveTab(newTab);
        router.push(`/account?tab=${newTab}`, { scroll: false });
    };

    const memberSince = formatMemberSince(user.createdAt);
    const firstName = user.name?.split(' ')[0] || 'Usuario';

    return (
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:px-12 sm:py-24">
            <section className="mb-16 sm:mb-20 flex items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-dark-900 text-light-100 flex items-center justify-center text-xl sm:text-2xl font-light font-roboto-slab">
                    {firstName[0]}
                </div>
                <div>
                    <h1 className="text-2xl font-light tracking-wide text-dark-900 mb-2 font-roboto-slab leading-tight">
                        {firstName}
                    </h1>
                    {memberSince && (
                        <p className="text-[10px] uppercase tracking-[0.2em] text-dark-700 font-light font-roboto">
                            Miembro desde {memberSince}
                        </p>
                    )}
                </div>
            </section>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-10 sm:space-y-12">
                <TabsList className="inline-flex gap-8 sm:gap-12 border-b border-light-200 font-roboto w-full sm:w-auto overflow-x-auto">
                    {TABS.map(({ value, label }) => (
                        <TabsTrigger key={value} value={value} className={TAB_CLASS}>
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <article className="rounded-xl border border-dark-900/10 bg-white p-8 sm:p-12 hover:border-light-400 transition-colors duration-300">
                        <h2 className="text-lg sm:text-xl font-light text-dark-900 mb-2 font-roboto-slab tracking-wide pb-6 border-b border-light-200">
                            Información Personal
                        </h2>
                        <div className="space-y-8">
                            <div>
                                <span className={LABEL_CLASS}>Nombre Completo</span>
                                <p className="text-xs md:text-[13px] text-dark-900 font-roboto font-light"> {user.name || "No configurado"}</p>
                            </div>
                            <div>
                                <span className={LABEL_CLASS}>Correo Electrónico</span>
                                <p className="text-xs md:text-[13px] text-dark-900 font-roboto font-light">{user.email}</p>
                            </div>
                            <div>
                                <span className={LABEL_CLASS}>Estado de Cuenta</span>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-green" />
                                    <p className="text-xs md:text-[13px] text-green font-roboto font-light">Activa</p>
                                </div>
                            </div>
                        </div>
                    </article>
                </TabsContent>

                <TabsContent value="orders" className="space-y-6">
                    {initialOrders.length === 0 ? (
                        <div className="rounded-xl border border-light-300 bg-white p-16 sm:p-20 text-center">
                            <Package className="h-16 w-16 text-dark-300 mx-auto mb-8" strokeWidth={1} />
                            <h3 className="text-2xl sm:text-3xl font-light text-dark-900 mb-4 font-roboto-slab tracking-wide">
                                Tu viaje comienza aquí
                            </h3>
                            <p className="text-xs md:text-[13px] text-dark-600 mb-10 font-roboto leading-relaxed max-w-md mx-auto font-light">
                                Descubre piezas únicas diseñadas para complementar tu estilo personal
                            </p>
                            <Link
                                href="/products"
                                className="inline-block rounded-full bg-dark-900 px-10 py-4 text-sm uppercase tracking-[0.1em] text-light-100 transition-all duration-300 hover:opacity-90 hover:scale-105 font-roboto font-light"
                            >
                                Explorar Colección
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {initialOrders.map((order) => {
                                const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ||
                                    { color: "bg-gray-500/10 text-gray-500", label: "Desconocido" };

                                return (
                                    <div
                                        key={order.id}
                                        className="rounded-xl border border-light-300 bg-white p-6 sm:p-8 hover:border-dark-900 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-2">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-dark-700 font-roboto font-light">
                                                    Pedido #{order.id.slice(-8).toUpperCase()}
                                                </p>
                                                <p className="text-lg sm:text-xl font-light text-dark-900 font-roboto-slab">
                                                    {formatPrice(Number(order.totalAmount))}
                                                </p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-full text-xs uppercase tracking-wide font-light ${config.color}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-6 border-t border-light-200">
                                            <p className="text-xs md:text-[13px] text-dark-500 font-roboto font-light">
                                                {new Date(order.createdAt).toLocaleDateString("es-CO", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="addresses">
                    <AddressManager initialAddresses={initialAddresses} />
                </TabsContent>
            </Tabs>
        </main>
    );
}