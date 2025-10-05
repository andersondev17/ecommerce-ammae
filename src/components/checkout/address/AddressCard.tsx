import { Button } from "@/components/ui/Button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AddressData } from "@/lib/actions/order";
import { AddressFormValues, addressSchema } from "@/lib/validations/address";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Edit3, Trash2 } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";

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
            className={`border rounded-xl p-6 cursor-pointer transition-all duration-300 ${isSelected
                ? "border-dark-900 bg-light-50"
                : "border-light-300 hover:border-dark-900"
                }`}
            onClick={onSelect}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        {isSelected && <Check className="h-4 w-4 text-dark-900" />}
                        <span className="text-xs md:text-[13px] font-light text-dark-900 font-roboto">
                            {address.line1}
                        </span>
                        {address.isDefault && (
                            <span className="text-[10px] uppercase tracking-[0.15em] text-dark-700 bg-light-200 px-2 py-1 rounded font-roboto font-light">
                                Por defecto
                            </span>
                        )}
                    </div>
                    <p className="text-xs md:text-[13px] text-dark-700 font-roboto font-light">
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
                        className="text-dark-500 hover:text-dark-900 disabled:opacity-50 transition"
                        aria-label="Editar dirección"
                    >
                        <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        disabled={disabled}
                        className="text-red hover:text-red/80 disabled:opacity-50 transition"
                        aria-label="Eliminar dirección"
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
const LABEL_CLASS = "text-[10px] uppercase tracking-[0.2em] text-dark-900 font-roboto font-light";

export function AddressForm({ initialData, onSave, onCancel, disabled }: AddressFormProps) {
    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        mode: "onChange",
        shouldFocusError: true,
        defaultValues: {
            line1: initialData?.line1 ?? "",
            line2: initialData?.line2 ?? "",
            city: initialData?.city ?? "",
            state: initialData?.state ?? "",
            postalCode: initialData?.postalCode ?? "",
            country: initialData?.country ?? "Colombia",
            isDefault: initialData?.isDefault ?? false,
        }
    });

    const handleSubmit: SubmitHandler<AddressFormValues> = (values) => {
        const dataToSave: Partial<AddressData> = {
            ...values,
            line2: values.line2,
            type: "shipping"
        };
        onSave(dataToSave);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="border border-dark-900/10 rounded-xl p-8 space-y-6 bg-white"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="line1"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel className={LABEL_CLASS}>Dirección *</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        autoFocus
                                        autoComplete="address-line1"
                                        placeholder="Calle 123 #45-67"
                                        disabled={disabled}
                                    />
                                </FormControl>
                                <FormMessage className="text-xs font-roboto" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="line2"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel className={LABEL_CLASS}>Apartamento, suite, etc.</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        autoComplete="address-line2"
                                        placeholder="Apto 101"
                                        disabled={disabled}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={LABEL_CLASS}>Ciudad *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Medellín" disabled={disabled} />
                                </FormControl>
                                <FormMessage className="text-xs font-roboto" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={LABEL_CLASS}>Departamento *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Antioquia" disabled={disabled} />
                                </FormControl>
                                <FormMessage className="text-xs font-roboto" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={LABEL_CLASS}>Código Postal *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="050001" disabled={disabled} />
                                </FormControl>
                                <FormMessage className="text-xs font-roboto" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={LABEL_CLASS}>País</FormLabel>
                                <FormControl>
                                    <select {...field} disabled={disabled} className="w-full px-4 py-3 border border-light-300 rounded-lg text-xs md:text-[13px] font-roboto font-light focus:outline-none focus:border-dark-900 transition disabled:opacity-50">
                                        <option value="Colombia">Colombia</option>
                                    </select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl>
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    disabled={disabled}
                                    className="h-4 w-4 rounded border-light-300 disabled:opacity-50"
                                />
                            </FormControl>
                            <FormLabel className="text-xs md:text-[13px] text-dark-700 font-roboto font-light !m-0">
                                Establecer como dirección predeterminada
                            </FormLabel>
                        </FormItem>
                    )}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button type="submit" disabled={disabled} variant="primary" fullWidth>
                        {initialData ? "Actualizar" : "Guardar"} Dirección
                    </Button>
                    <Button type="button" onClick={onCancel} disabled={disabled} variant="secondary" fullWidth>
                        Cancelar
                    </Button>
                </div>
            </form>
        </Form>
    );
}