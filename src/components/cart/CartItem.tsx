import { CartItem as CartItemType } from "@/lib/actions/cart";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface CartItemProps {
  item: CartItemType;
  isLoading: boolean;
  onQuantityChange: (productVariantId: string, quantity: number) => void;
  onRemove: (productVariantId: string) => void;
}

export function CartItem({ item, isLoading, onQuantityChange, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 p-6 border border-gray-200 rounded-lg">
      <div className="relative w-24 h-24 flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="rounded-md object-cover"
          sizes="96px"
        />
      </div>

      <div className="flex-1">
        <h2 className="font-semibold text-gray-900 text-lg">{item.name}</h2>
        <p className="text-gray-600 text-sm">
          {item.color && `Color: ${item.color}`}
          {item.color && item.size && " • "}
          {item.size && `Talla: ${item.size}`}
        </p>
        <p className="font-semibold text-gray-900 mt-2">
          ${(item.salePrice ?? item.price)}
          {item.salePrice && (
            <span className="ml-2 text-sm text-gray-500 line-through">
              ${item.price}
            </span>
          )}
        </p>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => onQuantityChange(item.productVariantId, item.quantity - 1)}
            className="p-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center text-gray-900">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.productVariantId, item.quantity + 1)}
            className="p-1 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        onClick={() => onRemove(item.productVariantId)}
        className="text-red-500 hover:text-red-700 self-start transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}