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
        subtitle: "Envíos gratuitos",
        content: "Tiempo de entrega estimado: 3-4 días hábiles."
    },
    {
        icon: RefreshCw,
        title: "Cambios y devoluciones",
        subtitle: "Cambios y devoluciones gratuitas",
        content: "Para solicitar cambios o devoluciones, contacta a servicioammae@gmail.com dentro de los 5 días hábiles. Evaluaremos cada caso individualmente."
    }
];

export const CATEGORY_VISUALS = {
    perfumes: {
        image: "/perfumes/bannerPerfumes.png",
        title: "Fragancias",
        description: "Esencias que cuentan historias",
        color: "from-amber-700/90 via-rose-900/60"
    },
    jeans: {
        image: "/jeans/bannerDemin.png",
        title: "Denim",
        description: "El clásico reinventado",
        color: "from-indigo-800/90 via-sky-900/50"
    },
};
