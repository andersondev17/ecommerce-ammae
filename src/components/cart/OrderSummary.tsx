interface OrderSummaryProps {
    subtotal?: number;
    total?: number;
    isLoading: boolean;
    onCheckout: () => void;
}

export function OrderSummary({ subtotal = 0, total = 0, isLoading, onCheckout }: OrderSummaryProps) {
    return (
        <div className="lg:col-span-1">
            <div className="p-6 border border-gray-200 rounded-lg sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Summary</h2>

                <div className="space-y-4 text-sm">
                    <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                        <span>Estimated Delivery & Handling</span>
                        <span>$2.00</span>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between font-semibold text-gray-900 text-base">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onCheckout}
                    className="w-full bg-black text-white py-3 rounded-full mt-6 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : "Proceed to Checkout"}
                </button>
            </div>
        </div>
    );
}