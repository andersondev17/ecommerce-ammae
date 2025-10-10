// src/lib/payments/types.ts

export interface PaymentStrategy {
    pay(params: PaymentParams): Promise<PaymentResult>;
    validateWebhook?(body: string, signature: string): boolean;
}

export interface PaymentParams {
    cartId: string;
    userId?: string;
    amount: number;
    items: CartItemForPayment[];
    successUrl: string;
    cancelUrl: string;
}

export interface CartItemForPayment {
    name: string;
    price: number;
    quantity: number;
    image?: string;
    productVariantId?: string; 
}

export interface PaymentResult {
    success?: boolean;
    redirectUrl?: string;
    sessionId?: string;
    preferenceId?: string; 
    orderId?: string;
    error?: string;
    method?: PaymentMethod
    url?: string;
}

export interface PaymentResponse {
    id?: string | number ;
    status?: string;
    external_reference?: string; // tu referencia interna, ej. orderId
    transaction_amount?: number;
    currency_id?: string;
    metadata?: {
        cartId?: string;
        orderId?: string;
        userId?: string;
        items?: string;
        integration_type?: string;
        platform?: string;
        created_at?: string;
    };
    payer?: {
        id?: string;
        email?: string;
    };
}

export type PaymentMethod = 'mercadopago' | 'whatsapp';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';