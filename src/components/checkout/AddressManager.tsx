
'use client';
import { deleteAddress, saveAddress, updateAddress, type AddressData } from "@/lib/actions/order";
import { MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AddressCard, AddressForm } from "./address/AddressCard";

interface Address {
    id: string;
    userId: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    type: "shipping" | "billing";
    isDefault: boolean;
}

interface AddressManagerProps {
    initialAddresses: Address[];
}

export function AddressManager({ initialAddresses }: AddressManagerProps) {
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
        initialAddresses.find(addr => addr.isDefault && addr.type === "shipping")?.id || null
    );
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const shippingAddresses = addresses.filter(addr => addr.type === "shipping");

    const handleSelectAddress = (addressId: string) => {
        setSelectedAddressId(addressId);
    };

    const handleContinueCheckout = () => {
        if (!selectedAddressId) {
            toast.error("Selecciona una dirección para continuar");
            return;
        }
        router.push("/cart");
    };

const handleSaveAddress = (addressData: AddressData | Partial<AddressData>) => {
        startTransition(async () => {
            try {
                const result = await saveAddress(addressData as AddressData);
                if (result.success && result.address) {
                    setAddresses(prev => [...prev, result.address]);
                    setIsAddingNew(false);
                    toast.success("Dirección guardada exitosamente");

                    if (addressData.isDefault || shippingAddresses.length === 0) {
                        setSelectedAddressId(result.address.id);
                    }
                } else {
                    toast.error(result.error || "Error al guardar dirección");
                }
            } catch {
                toast.error("Error al guardar dirección");
            }
        });
    };

    const handleUpdateAddress = (addressId: string, addressData: Partial<AddressData>) => {
        startTransition(async () => {
            try {
                const result = await updateAddress(addressId, addressData);
                if (result.success && result.address) {
                    setAddresses(prev =>
                        prev.map(addr => addr.id === addressId ? result.address : addr)
                    );
                    setEditingId(null);
                    toast.success("Dirección actualizada");
                } else {
                    toast.error(result.error || "Error al actualizar dirección");
                }
            } catch {
                toast.error("Error al actualizar dirección");
            }
        });
    };

    const handleDeleteAddress = (addressId: string) => {
        startTransition(async () => {
            try {
                const result = await deleteAddress(addressId);
                if (result.success) {
                    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
                    if (selectedAddressId === addressId) {
                        setSelectedAddressId(null);
                    }
                    toast.success("Dirección eliminada");
                } else {
                    toast.error(result.error || "Error al eliminar dirección");
                }
            } catch {
                toast.error("Error al eliminar dirección");
            }
        });
    };

    // Estado vacío
    if (shippingAddresses.length === 0 && !isAddingNew) {
        return (
            <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-dark-400 mx-auto mb-4" />
                <h3 className="text-heading-3 text-dark-900 mb-2">Sin direcciones de envío</h3>
                <p className="text-body text-dark-700 mb-6">
                    Agrega tu primera dirección para continuar con el checkout
                </p>
                <button
                    onClick={() => setIsAddingNew(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    Agregar Dirección
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Lista de direcciones */}
            <div className="space-y-4">
                {shippingAddresses.map((address) => (
                    <AddressCard
                        key={address.id}
                        address={address}
                        isSelected={selectedAddressId === address.id}
                        isEditing={editingId === address.id}
                        onSelect={() => handleSelectAddress(address.id)}
                        onEdit={() => setEditingId(address.id)}
                        onSave={(data) => handleUpdateAddress(address.id, data)}
                        onDelete={() => handleDeleteAddress(address.id)}
                        onCancelEdit={() => setEditingId(null)}
                        disabled={isPending}
                    />
                ))}
            </div>

            {/* Agregar nueva dirección */}
            {isAddingNew ? (
                <AddressForm
                    onSave={handleSaveAddress}
                    onCancel={() => setIsAddingNew(false)}
                    disabled={isPending}
                />
            ) : (
                <button
                    onClick={() => setIsAddingNew(true)}
                    className="w-full border border-dashed border-dark-300 rounded-lg p-6 text-center text-body text-dark-700 hover:border-dark-500 hover:text-dark-900 transition"
                >
                    <Plus className="h-5 w-5 inline mr-2" />
                    Agregar Nueva Dirección
                </button>
            )}

            {/* Botón continuar */}
            {selectedAddressId && (
                <div className="pt-6 border-t border-light-300">
                    <button
                        onClick={handleContinueCheckout}
                        disabled={isPending}
                        className="w-full rounded-full bg-dark-900 px-6 py-4 text-body-medium text-light-100 transition hover:opacity-90 disabled:opacity-50"
                    >
                        Continuar al Checkout
                    </button>
                </div>
            )}
        </div>
    );
}