"use client";

import { handleCheckout, validateCheckoutRequirements } from "@/lib/actions/checkout";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/Button";

interface CartItem {
    productVariantId: string;
    name: string;
    price: number;
    salePrice?: number;
    quantity: number;
    image?: string;
}

interface CartSummaryProps {
    items: CartItem[];
    amount: number;
}

export function CartSummary({ items }: CartSummaryProps) {
    const [pendingMethod, setPendingMethod] = useState<"mercadopago" | "whatsapp" | null>(null);

    const subtotal = items.reduce((sum, item) => {
        const price = item.salePrice ?? item.price;
        return sum + (price * item.quantity);
    }, 0);

    const shipping = 0;
    const total = subtotal + shipping;
    const router = useRouter();

    const handlePay = async (method: "mercadopago" | "whatsapp") => {
        if (pendingMethod) return; // Prevenir doble click

        setPendingMethod(method);

        try {
            const validation = await validateCheckoutRequirements();

            if (!validation.success) {
                toast.error("Error al validar checkout");
                return;
            }

            if (validation.requiresAuth) {
                toast.error("Debes iniciar sesión para continuar");
                router.push("/sign-in?redirect=/cart");
                return;
            }

            if (validation.requiresAddress) {
                toast.error("Necesitas agregar una dirección de envío");
                router.push("/checkout/address");
                return;
            }

            const result = await handleCheckout(method);

            if ('error' in result) {
                console.error('Checkout failed:', result.error);

                // Mejorar mensajes de error específicos
                const errorMessage = result.error || "Error desconocido";
                let friendlyMessage = errorMessage;

                if (errorMessage.includes('Stock insuficiente'))
                    friendlyMessage = "Algunos productos ya no están disponibles en la cantidad solicitada.";
                else if (errorMessage.includes('MercadoPago'))
                    friendlyMessage = "Error al procesar el pago. Verifica tus datos e intenta nuevamente.";
                else if (errorMessage.includes('productos sin información'))
                    friendlyMessage = "Error en el carrito. Recarga la página e intenta nuevamente.";

                toast.error(friendlyMessage);
                return;
            }

                if ('checkoutUrl' in result && result.checkoutUrl) {
                    console.log('Redirecting to:', result.checkoutUrl);

                    // Limpiar ANTES del redirect con timeout
                    const { clearAfterCheckout } = useCartStore.getState();
                    clearAfterCheckout();

                    // Forzar flush del localStorage antes del redirect
                    setTimeout(() => {
                        window.location.href = result.checkoutUrl;
                    }, 150);

                    return;
                }

                console.error('No checkoutUrl found in result');
                toast.error("No se pudo generar la URL de pago");

            } catch (error) {
                console.error("Checkout exception:", error);
                toast.error("Error al iniciar el pago. Intenta nuevamente.");
            }
    };


    return (
        <div className="rounded-lg bg-light-100 p-6">
            <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-heading-4 text-dark-900 font-roboto font-light">Subtotal</span>
                    <span className="text-base text-dark-900 font-light font-roboto">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-heading-4 text-dark-900 font-roboto font-light">Envío</span>
                    <span className="text-lg text-dark-900 font-light font-roboto">{shipping === 0 ? 'GRATIS' : formatPrice(shipping)}</span>
                </div>
            </div>

            <div className="border-t border-light-300 pt-4 mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-heading-4 text-dark-900 font-medium font-roboto">Total</span>
                    <span className="text-lg text-dark-900 font-medium font-roboto">{formatPrice(total)}</span>
                </div>
            </div>

            <div className="space-y-3">
                <Button
                    onClick={() => handlePay("mercadopago")}
                    isLoading={pendingMethod === "mercadopago"}
                    disabled={!!pendingMethod}
                    fullWidth
                >
                    {pendingMethod === "mercadopago" ? 'Procesando...' : 'Pagar con Mercado Pago'}
                </Button>

                <Button
                    onClick={() => handlePay("whatsapp")}
                    variant="secondary"
                    isLoading={pendingMethod === "whatsapp"}
                    disabled={!!pendingMethod}
                    fullWidth
                >
                    {pendingMethod === "whatsapp" ? 'Procesando...' : 'Enviar por WhatsApp'}
                </Button>
            </div>
        </div>
    );
}