"use client";

import { handleCheckout, validateCheckoutRequirements } from "@/lib/actions/checkout";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

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
    const [isPending, startTransition] = useTransition();

    const subtotal = items.reduce((sum, item) => {
        const price = item.salePrice ?? item.price;
        return sum + (price * item.quantity);
    }, 0);

    const shipping = 200;
    const total = subtotal + shipping;
    const router = useRouter();

    const handlePay = (method: "mercadopago" | "whatsapp") => {
        startTransition(async () => {
            try {
                // 1. Validate checkout requirements first
                const validation = await validateCheckoutRequirements();

                if (!validation.success) {
                    toast.error("Error al validar checkout");
                    return;
                }

                // 2. Handle authentication requirement
                if (validation.requiresAuth) {
                    toast.error("Debes iniciar sesión para continuar");
                    router.push("/sign-in?redirect=/cart");
                    return;
                }

                // 3. Handle missing address requirement
                if (validation.requiresAddress) {
                    toast.error("Necesitas agregar una dirección de envío");
                    router.push("/checkout/address");
                    return;
                }

                // 4. Proceed with checkout if all validations pass
                console.log('Calling handleCheckout...');
                const result = await handleCheckout(method);
                console.log('Result:', result);

                if ('error' in result) {
                    console.error('Checkout failed:', result.error);
                    toast.error(result.error);
                    return;
                }

                // 5. Handle successful checkout response
                if ('checkoutUrl' in result && result.checkoutUrl) {
                    console.log('Redirecting to:', result.checkoutUrl);
                    window.location.href = result.checkoutUrl;
                    return;
                }

                console.error('No checkoutUrl found in result');
                toast.error("No se pudo generar la URL de pago");

            } catch (error) {
                console.error("Checkout exception:", error);
                toast.error("Error al iniciar el pago. Intenta nuevamente.");
            }
        });
    };


    return (
        <div className="rounded-lg bg-light-100 p-6">
            <h2 className="text-heading-3 text-dark-900 mb-6">Resumen</h2>

            <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-body text-dark-700">Subtotal</span>
                    <span className="text-body text-dark-900">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-body text-dark-700">Envío</span>
                    <span className="text-body text-dark-900">{formatCurrency(shipping)}</span>
                </div>
            </div>

            <div className="border-t border-light-300 pt-4 mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-lead text-dark-900 font-medium">Total</span>
                    <span className="text-lead text-dark-900 font-medium">{formatCurrency(total)}</span>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => handlePay("mercadopago")}
                    disabled={isPending || items.length === 0}
                    className="w-full rounded-full bg-dark-900 px-6 py-4 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
                </button>

                <button
                    onClick={() => handlePay("whatsapp")}
                    disabled={isPending || items.length === 0}
                    className="w-full rounded-full border border-dark-900 px-6 py-4 text-body-medium text-dark-900 transition hover:bg-dark-900 hover:text-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? "Abriendo WhatsApp..." : "Enviar por WhatsApp"}
                </button>
            </div>
        </div>
    );
}