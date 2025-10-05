
'use client';
import { deleteAddress, saveAddress, updateAddress, type AddressData } from "@/lib/actions/order";
import { MapPin, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
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
const BUTTON_SECONDARY = "w-full border border-dashed border-dark-300 rounded-xl p-6 text-center text-xs md:text-[13px] text-dark-700 hover:border-dark-500 hover:text-dark-900 transition font-roboto font-light";

export function AddressManager({ initialAddresses }: AddressManagerProps) {
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
        initialAddresses.find(addr => addr.isDefault && addr.type === "shipping")?.id || null
    );
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const shippingAddresses = addresses.filter(addr => addr.type === "shipping");

    const handleSelectAddress = (addressId: string) => {
        setSelectedAddressId(addressId);
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

    if (shippingAddresses.length === 0 && !isAddingNew) {
        return (
            <div className="rounded-xl border border-light-300 bg-white p-16 sm:p-20 text-center">
                <MapPin className="h-12 w-12 text-dark-300 mx-auto mb-8" strokeWidth={1} />
                <h3 className="text-xl sm:text-2xl font-light text-dark-900 mb-4 font-roboto-slab tracking-wide">Sin direcciones de envío</h3>
                <p className="text-xs md:text-[13px] text-dark-600 mb-10 font-roboto leading-relaxed max-w-md mx-auto font-light">
                    Agrega tu primera dirección para continuar
                </p>
                <Button onClick={() => setIsAddingNew(true)} fullWidth disabled={isPending}>
                    <Plus className="h-4 w-4" />
                    Agregar Dirección
                </Button>
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
                <button onClick={() => setIsAddingNew(true)} className={`${BUTTON_SECONDARY} flex items-center justify-center`}>
                    <Plus className="h-5 w-5 mr-2" />
                    Agregar Nueva Dirección
                </button>
            )}
        </div>
    );
}