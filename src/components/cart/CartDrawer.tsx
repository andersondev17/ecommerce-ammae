"use client";

import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader } from "@/components/ui/drawer";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

export function CartDrawer() {
    const [open, setOpen] = useState(false);
    const { lastAddedItem } = useCartStore();
    const router = useRouter();
    // Abrir drawer cuando hay nuevo item
    useEffect(() => {
        if (lastAddedItem) {
            setOpen(true);
        }
    }, [lastAddedItem]);

    //  Limpiar flag cuando el drawer se cierra
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen)
            useCartStore.setState({ lastAddedItem: null });
    };

    // El drawer se controla con el estado open, no con conditional rendering
    if (!lastAddedItem) {
        return null;
    }

    const displayPrice = lastAddedItem.salePrice ?? lastAddedItem.price;
    const compareAt = lastAddedItem.salePrice ? lastAddedItem.price : null;
    const discount = compareAt && displayPrice
        ? Math.round(((compareAt - displayPrice) / compareAt) * 100)
        : null;

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-md">
                    <DrawerHeader>
                        <h2 id="cart-drawer-title">Añadido al Carrito</h2>
                    </DrawerHeader>

                    <section className="px-6 py-4">
                        <div className="flex gap-4">
                            <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-light-200">
                                <Image
                                    src={lastAddedItem.image}
                                    alt={lastAddedItem.name}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                    aria-describedby="nombre-producto"
                                />
                            </div>

                            <div className="flex-1 space-y-1">
                                <p className="text-[10px] uppercase text-dark-900 font-light font-roboto-slab" itemProp="sku">
                                    {lastAddedItem.id.slice(-6).toUpperCase()}
                                </p>


                                <h3 className="text-lg font-light tracking-wide font-roboto" itemProp="name">
                                    {lastAddedItem.name}
                                </h3>
                                {(lastAddedItem.color || lastAddedItem.size) && (
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-dark-700 font-light font-roboto">
                                        {lastAddedItem.color && lastAddedItem.color}
                                        {lastAddedItem.color && lastAddedItem.size && ' • '}
                                        {lastAddedItem.size && `Talla ${lastAddedItem.size}`}
                                    </p>
                                )}

                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] uppercase tracking-[0.1em] font-light text-dark-900 font-roboto-slab">
                                        {formatPrice(displayPrice)}
                                    </p>
                                    {compareAt && (
                                        <>
                                            <span className="text-sm text-dark-700 line-through font-roboto-slab">
                                                {formatPrice(compareAt)}
                                            </span>
                                            {discount !== null && (
                                                <span className="rounded-full border border-light-300 px-2 py-0.5 text-[10px] text-green font-roboto uppercase">
                                                    {discount}% off
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <DrawerFooter className="flex-col gap-3">
                        <DrawerClose asChild>
                            <Button onClick={() => { router.push("/cart"); }}
                                variant="primary" size="md" fullWidth aria-label="Ver Carrito"
                            >
                                Ver su cesta
                            </Button>
                        </DrawerClose>

                        <DrawerClose asChild>
                            <Button
                                onClick={() => console.log("seguir comprando")}
                                variant="secondary"
                                size="md"
                                fullWidth
                                ariaLabel="Continuar Comprando"
                            >
                                Continuar Comprando
                            </Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}   