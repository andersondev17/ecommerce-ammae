import OrderSuccess from "@/components/checkout/OrderSuccess";
import { getOrder } from "@/lib/actions/order";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Order Success - AMMAE",
    description: "Your order has been successfully placed",
};

interface PageProps {
    searchParams: Promise<{
        // Parámetros oficiales de MP según documentación
        payment_id?: string;
        status?: string;
        external_reference?: string;
        merchant_order_id?: string;
        collection_id?: string;
        collection_status?: string;
        preference_id?: string;
        // WhatsApp params
        order_id?: string;
        method?: string;
    }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
    const params = await searchParams;
    
    console.log('Success page received params:', params);

    // Manejar success de Mercado Pago usando external_reference
    if (params.external_reference && (params.status === 'approved' || params.collection_status === 'approved')) {
        const orderId = params.external_reference; // Este es nuestro orderId de la orden creada
        
        console.log('Processing MP success for order:', orderId);
        
        const orderResult = await getOrder(orderId);
        
        if (orderResult?.order) {
            return (
                <OrderSuccess
                    orderId={orderResult.order.id}
                    items={orderResult.items.map(item => ({
                        name: `Producto ${item.productVariantId}`, // Simplificado por ahora
                        quantity: item.quantity,
                        price: Number(item.priceAtPurchase),
                        image: undefined
                    }))}
                    total={Number(orderResult.order.totalAmount)}
                    paymentMethod="mercadopago"
                    status="paid" // MP confirmó el pago
                />
            );
        }
    }

    // Manejar pending de Mercado Pago
    if (params.external_reference && (params.status === 'pending' || params.collection_status === 'pending')) {
        const orderId = params.external_reference;
        
        console.log('Processing MP pending for order:', orderId);
        
        const orderResult = await getOrder(orderId);
        
        if (orderResult?.order) {
            return (
                <OrderSuccess
                    orderId={orderResult.order.id}
                    items={orderResult.items.map(item => ({
                        name: `Producto ${item.productVariantId}`,
                        quantity: item.quantity,
                        price: Number(item.priceAtPurchase),
                        image: undefined
                    }))}
                    total={Number(orderResult.order.totalAmount)}
                    paymentMethod="mercadopago"
                    status="pending" // Pago pendiente (efectivo, etc.)
                />
            );
        }
    }

    // Manejar WhatsApp orders
    if (params.order_id && params.method === 'whatsapp') {
        const orderResult = await getOrder(params.order_id);
        
        if (orderResult?.order) {
            return (
                <OrderSuccess
                    orderId={orderResult.order.id}
                    items={orderResult.items.map(item => ({
                        name: `Producto ${item.productVariantId}`,
                        quantity: item.quantity,
                        price: Number(item.priceAtPurchase),
                        image: undefined
                    }))}
                    total={Number(orderResult.order.totalAmount)}
                    paymentMethod="whatsapp"
                    status="pending"
                />
            );
        }
    }

    // Si no hay parámetros válidos, redirect al cart
    console.log('No valid parameters found, redirecting to cart');
    redirect("/cart?error=invalid_payment");
}