import { z } from "zod";

export const addressSchema = z.object({
    line1: z.string().min(1, "La dirección es obligatoria"),
    line2: z.string(),
    city: z.string().min(1, "La ciudad es obligatoria"),
    state: z.string().min(1, "El departamento es obligatorio"),
    postalCode: z.string().min(1, "El código postal es obligatorio"),
    country: z.string(),
    isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;