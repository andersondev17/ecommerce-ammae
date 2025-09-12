import Link from "next/link";

export function EmptyCart() {
    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Cart</h1>
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Your cart is empty</p>
                <Link
                    href="/products"
                    className="bg-dark-900 text-light-100 px-6 py-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
}
export function CartSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 p-6 border rounded-lg">
                            <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}