"use client";

import { CheckoutInfo } from "@/components/checkout/CheckoutInfo";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import confetti from "canvas-confetti";
import { CheckCircle, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    image?: string;
}

interface OrderSuccessProps {
    orderId: string;
    items: OrderItem[];
    total: number;
    paymentMethod: "mercadopago" | "whatsapp";
    status: "pending" | "paid";
    whatsappUrl?: string;
}

export default function OrderSuccess({
    orderId,
    items,
    total,
    paymentMethod,
    status,
    whatsappUrl
}: OrderSuccessProps) {
    useEffect(() => {
        if (status === "paid") {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [status]);

    const shortOrderId = orderId.slice(-8).toUpperCase();

    return (
        <div className="min-h-screen bg-light-100">
            <main className="mx-auto max-w-7xl px-4 py-8 md:py-16 sm:px-6 lg:px-8">
                
                {/* ✅ Hero Section */}
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green/10 p-3">
                            <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-green" />
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl text-dark-900 mb-3 font-roboto-slab font-light tracking-tight">
                        {status === "paid" ? "¡Pago Exitoso!" : "¡Orden Recibida!"}
                    </h1>

                    <p className="text-sm md:text-base text-dark-700 mb-2 font-roboto font-light">
                        {status === "paid"
                            ? "Tu pago ha sido procesado correctamente"
                            : "Tu orden ha sido creada exitosamente"}
                    </p>

                    <p className="text-xs md:text-sm text-dark-500 font-roboto font-light">
                        Orden: <span className="font-medium text-dark-900">#{shortOrderId}</span>
                    </p>
                </div>

                {/* ✅ WhatsApp CTA (si aplica) */}
                {paymentMethod === "whatsapp" && whatsappUrl && (
                    <div className="mb-8 rounded-xl bg-green/5 border border-green/20 p-6 max-w-2xl mx-auto">
                        <div className="flex items-start gap-4">
                            <MessageCircle className="h-6 w-6 text-green flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <p className="text-sm md:text-base text-dark-900 mb-4 font-roboto font-light leading-relaxed">
                                    Para confirmar tu pedido y coordinar el pago, por favor contáctanos por WhatsApp.
                                </p>
                                <Button 
                                    href={whatsappUrl} 
                                    variant="secondary" 
                                    size="md"
                                    target="_blank"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Confirmar por WhatsApp
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ Layout: Resumen + Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    
                    {/* Resumen de la orden */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-light-300 bg-white overflow-hidden">
                            <div className="p-6 border-b border-light-300">
                                <h2 className="text-lg md:text-xl text-dark-900 font-roboto-slab font-light">
                                    Resumen del Pedido
                                </h2>
                            </div>

                            <div className="divide-y divide-light-300">
                                {items.map((item, index) => (
                                    <div key={index} className="p-6 flex gap-4">
                                        {item.image && (
                                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-light-200">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm md:text-base text-dark-900 font-roboto font-light mb-1">
                                                {item.name}
                                            </h3>
                                            <p className="text-xs md:text-sm text-dark-700 font-roboto font-light">
                                                Cantidad: {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm md:text-base text-dark-900 font-roboto-slab">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-light-50 space-y-3">
                                <div className="flex justify-between text-sm text-dark-700 font-roboto font-light">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(total - 10000)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-dark-700 font-roboto font-light">
                                    <span>Envío</span>
                                    <span>{formatPrice(10000)}</span>
                                </div>
                                <div className="pt-3 border-t border-light-300 flex justify-between text-base md:text-lg text-dark-900 font-roboto-slab">
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción (mobile) */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 lg:hidden">
                            <Button href="/" variant="secondary" fullWidth>
                                Volver al Inicio
                            </Button>
                            <Button href="/products" variant="primary" fullWidth>
                                Seguir Comprando
                            </Button>
                        </div>
                    </div>

                    {/* ✅ CheckoutInfo sidebar */}
                    <div className="lg:col-span-1">
                        
                        <div className="rounded-xl border border-light-300 bg-white overflow-hidden sticky top-20">
                            <CheckoutInfo />
                        </div>                        
                    </div>
                </div>
            </main>
        </div>
    );
}