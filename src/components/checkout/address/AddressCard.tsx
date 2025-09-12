

import { AddressData } from "@/lib/actions/order";
import { Check, Edit3, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
interface AddressCardProps {
    address: Address;
    isSelected: boolean;
    isEditing: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onSave: (data: Partial<AddressData>) => void;
    onDelete: () => void;
    onCancelEdit: () => void;
    disabled: boolean;
}

export function AddressCard({
    address,
    isSelected,
    isEditing,
    onSelect,
    onEdit,
    onSave,
    onDelete,
    onCancelEdit,
    disabled
}: AddressCardProps) {
    if (isEditing) {
        return (
            <AddressForm
                initialData={address}
                onSave={onSave}
                onCancel={onCancelEdit}
                disabled={disabled}
            />
        );
    }

    return (
        <div
            className={`border rounded-lg p-4 cursor-pointer transition ${isSelected
                    ? "border-dark-900 bg-dark-50 ring-2 ring-dark-900"
                    : "border-light-300 hover:border-dark-500"
                }`}
            onClick={onSelect}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        {isSelected && <Check className="h-4 w-4 text-dark-900" />}
                        <span className="text-body-medium text-dark-900">
                            {address.line1}
                        </span>
                        {address.isDefault && (
                            <span className="text-small text-dark-500 bg-light-200 px-2 py-1 rounded">
                                Por defecto
                            </span>
                        )}
                    </div>
                    <p className="text-body text-dark-700">
                        {address.line2 && `${address.line2}, `}
                        {address.city}, {address.state} {address.postalCode}
                        <br />
                        {address.country}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        disabled={disabled}
                        className="text-dark-500 hover:text-dark-900 disabled:opacity-50"
                    >
                        <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Formulario para crear/editar direcciones
interface AddressFormProps {
    initialData?: Partial<Address>;
    onSave: (data: AddressData | Partial<AddressData>) => void; 
    onCancel: () => void;
    disabled: boolean;
}

export function AddressForm({ initialData, onSave, onCancel, disabled }: AddressFormProps) {
    const [formData, setFormData] = useState({
        line1: initialData?.line1 || "",
        line2: initialData?.line2 || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        country: initialData?.country || "Colombia",
        postalCode: initialData?.postalCode || "",
        type: "shipping" as const,
        isDefault: initialData?.isDefault || false,
    });

    const handleSubmit = () => {
        if (!formData.line1 || !formData.city || !formData.state || !formData.postalCode) {
            toast.error("Completa todos los campos obligatorios");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="border border-light-300 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-body-medium text-dark-900 mb-2">
                        Dirección *
                    </label>
                    <input
                        type="text"
                        value={formData.line1}
                        onChange={(e) => setFormData(prev => ({ ...prev, line1: e.target.value }))}
                        className="w-full px-3 py-2 border border-light-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dark-500"
                        placeholder="Calle 123 #45-67"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="block text-body-medium text-dark-900 mb-2">
                        Apartamento, suite, etc. (opcional)
                    </label>
                    <input
                        type="text"
                        value={formData.line2}
                        onChange={(e) => setFormData(prev => ({ ...prev, line2: e.target.value }))}
                        className="w-full px-3 py-2 border border-light-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dark-500"
                        placeholder="Apto 101"
                    />
                </div>

                <div>
                    <label className="block text-body-medium text-dark-900 mb-2">
                        Ciudad *
                    </label>
                    <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-light-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dark-500"
                        placeholder="Medellín"
                    />
                </div>

                <div>
                    <label className="block text-body-medium text-dark-900 mb-2">
                        Departamento/Estado *
                    </label>
                    <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-light-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dark-500"
                        placeholder="Antioquia"
                    />
                </div>

                <div>
                    <label className="block text-body-medium text-dark-900 mb-2">
                        Código Postal *
                    </label>
                    <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="w-full px-3 py-2 border border-light-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dark-500"
                        placeholder="050001"
                    />
                </div>

                <div>
                    <label className="block text-body-medium text-dark-900 mb-2">
                        País
                    </label>
                    <select
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-light-300 rounded-md focus:outline-none focus:ring-2 focus:ring-dark-500"
                    >
                        <option value="Colombia">Colombia</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4 text-dark-900 focus:ring-dark-500 border-light-300 rounded"
                />
                <label htmlFor="isDefault" className="text-body text-dark-700">
                    Establecer como dirección predeterminada
                </label>
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    onClick={handleSubmit}
                    disabled={disabled}
                    className="flex-1 rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 disabled:opacity-50"
                >
                    {initialData ? "Actualizar" : "Guardar"} Dirección
                </button>
                <button
                    onClick={onCancel}
                    disabled={disabled}
                    className="flex-1 rounded-full border border-dark-300 px-6 py-3 text-body-medium text-dark-900 transition hover:bg-light-50 disabled:opacity-50"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}