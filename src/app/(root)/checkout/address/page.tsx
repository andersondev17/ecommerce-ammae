import { AddressManager } from "@/components/checkout/AddressManager";
import { getUserAddresses } from "@/lib/actions/order";
import { getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Dirección de Envío | Checkout",
    description: "Agregar o seleccionar dirección de envío para completar tu pedido",
};

export default async function CheckoutAddressPage() {
    const user = await getCurrentUser();

    if (!user?.id) {
        redirect("/auth?redirect=/checkout/address");
    }

    const addressResult = await getUserAddresses();
    const addresses = addressResult.success ? addressResult.addresses : [];

    return (
        <div className="min-h-screen bg-light-100">
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">


                <AddressManager
                    initialAddresses={addresses || []}
                />
            </div>
        </div>
    );
}