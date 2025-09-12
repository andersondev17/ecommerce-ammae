// success UI after checkout
"use client";

import confetti from "canvas-confetti";
import { CheckCircle, Home, Package, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    image?: string ;
}

interface OrderSuccessProps {
    orderId: string;
    items: OrderItem[];
    total: number;
    paymentMethod: "mercadopago" | "whatsapp";
    status: "pending" | "paid";
}

export default function OrderSuccess({
    orderId,
    items,
    total,
    paymentMethod,
    status,
}: OrderSuccessProps) {
    useEffect(() => {
        // Trigger confetti animation on mount
        if (status === "paid") {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [status]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-light-100">
            <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-green/10 p-3">
                            <CheckCircle className="h-12 w-12 text-green" />
                        </div>
                    </div>

                    <h1 className="text-heading-2 text-dark-900 mb-4">
                        {status === "paid" ? "¡Pago Exitoso!" : "¡Orden Recibida!"}
                    </h1>

                    <p className="text-lead text-dark-700 mb-2">
                        {status === "paid"
                            ? "Tu pago ha sido procesado correctamente"
                            : "Tu orden ha sido enviada por WhatsApp"}
                    </p>

                    <p className="text-body text-dark-500 mb-8">
                        Número de orden: <span className="font-medium text-dark-900">{orderId}</span>
                    </p>

                    {paymentMethod === "whatsapp" && (
                        <div className="mb-8 rounded-xl bg-orange/10 border border-orange/20 p-4">
                            <p className="text-body text-dark-900">
                                📱 Tu orden fue enviada por WhatsApp. Un asesor te contactará pronto para coordinar el pago y envío.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-12 rounded-xl border border-light-300 bg-white p-6">
                    <h2 className="text-heading-3 text-dark-900 mb-6">Resumen del Pedido</h2>

                    <div className="space-y-4 mb-6">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-4">
                                {item.image && (
                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-body-medium text-dark-900">{item.name}</h3>
                                    <p className="text-body text-dark-700">
                                        Cantidad: {item.quantity} × {formatPrice(item.price)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-body-medium text-dark-900">
                                        {formatPrice(item.price * item.quantity)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-light-300 pt-4">
                        <div className="flex justify-between text-body text-dark-700 mb-2">
                            <span>Subtotal</span>
                            <span>{formatPrice(total - 200)}</span>
                        </div>
                        <div className="flex justify-between text-body text-dark-700 mb-3">
                            <span>Envío</span>
                            <span>{formatPrice(200)}</span>
                        </div>
                        <div className="flex justify-between text-lead text-dark-900">
                            <span className="font-medium">Total</span>
                            <span className="font-medium">{formatPrice(total)}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-light-300">
                        <div className="flex items-center gap-3 text-body text-dark-700">
                            <Package className="h-5 w-5" />
                            <div>
                                <p className="text-body-medium text-dark-900">Tiempo de entrega estimado</p>
                                <p>3-5 días hábiles en Medellín y área metropolitana</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 rounded-full border border-light-300 px-6 py-3 text-body-medium text-dark-900 transition hover:border-dark-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500"
                    >
                        <Home className="h-5 w-5" />
                        Volver al Inicio
                    </Link>
                    <Link
                        href="/products"
                        className="flex items-center justify-center gap-2 rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500"
                    >
                        <ShoppingBag className="h-5 w-5" />
                        Seguir Comprando
                    </Link>
                </div>
            </main>
        </div>
    );
}