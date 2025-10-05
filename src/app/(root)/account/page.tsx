import AccountContent from "@/components/account/AccountContent";
import { getUserAddresses, getUserOrders } from "@/lib/actions/order";
import { getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Mi Cuenta | AMMAE",
    description: "Gestiona tu cuenta, pedidos y direcciones",
};

export default async function AccountPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/sign-in?redirect=/account");
    }

    const [ordersResult, addressesResult] = await Promise.all([
        getUserOrders(),
        getUserAddresses(),
    ]);

    return (
        <AccountContent
            user={user}
            initialOrders={ordersResult.success ? ordersResult.orders ?? [] : []}
            initialAddresses={addressesResult.success ? addressesResult.addresses ?? [] : []}
        />
    );
}