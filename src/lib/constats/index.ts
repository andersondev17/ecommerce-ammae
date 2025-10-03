import { CreditCard, RefreshCw, Truck } from "lucide-react";

export const INFO_ITEMS = [
    {
        icon: CreditCard,
        title: "Información de pago",
        subtitle: "Todas las transacciones son seguras",
        content: "Aceptamos Mercado Pago y pagos por WhatsApp. Todos los pagos están protegidos con encriptación de nivel bancario. Tu información financiera nunca se comparte con nosotros."
    },
    {
        icon: Truck,
        title: "Detalles de entrega",
        subtitle: "Envíos gratuitos (disfrute de envío Express y Premium)",
        content: "Tiempo de entrega estimado: 3-4 días hábiles. Envío Express (24-48h) y Premium disponibles al finalizar compra. Rastrea tu pedido en tiempo real."
    },
    {
        icon: RefreshCw,
        title: "Cambios y devoluciones",
        subtitle: "Cambios y devoluciones gratuitas",
        content: "Tienes 30 días para cambios o devoluciones sin costo. El producto debe estar sin usar y con etiquetas originales. Proceso simple: solicita en tu cuenta, empaca el producto y un mensajero lo recogerá."
    }
];