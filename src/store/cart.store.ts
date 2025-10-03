import * as cartActions from '@/lib/actions/cart';
import { CartItem } from '@/lib/actions/cart';
import { guestSession } from '@/lib/auth/actions';
import { toast } from 'sonner';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  isInitialized: boolean;
  lastAddedItem: CartItem | null;
  clearAfterCheckout: () => void;

  // Computed properties as functions
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;

  // Actions
  initialize: () => Promise<void>;
  addItem: (variantId: string, qty?: number) => Promise<void>;
  updateQuantity: (variantId: string, qty: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  mergeGuestCart: (userId: string) => Promise<void>;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isInitialized: false,
      lastAddedItem: null,

      // Computed values as functions
      getItemCount: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      },

      getSubtotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => {
          const price = item.salePrice ?? item.price;
          return sum + ((price || 0) * (item.quantity || 0));
        }, 0);
      },

      getTotal: () => {
        return get().getSubtotal() + 2.00; // Shipping
      },

      setItems: (items: CartItem[]) => {
        set({ items, isInitialized: true });
      },

      async initialize() {
        if (get().isInitialized) return;

        set({ isLoading: true });
        try {
          const result = await cartActions.getCart();
          if (result.success) {
            set({
              items: result.data.items,
              isInitialized: true,
              isLoading: false
            });
          }
        } catch (error) {
          console.error('Cart initialization failed:', error);
          toast.error('Failed to load cart');
          set({ isLoading: false });
        }
      },

      async addItem(variantId: string, qty = 1) {
        set({ isLoading: true });
        try {
          // Optimistic update
          const currentItems = get().items;
          const existingItem = currentItems.find(item => item.productVariantId === variantId);

          if (existingItem) {
            set({
              items: currentItems.map(item =>
                item.productVariantId === variantId
                  ? { ...item, quantity: item.quantity + qty }
                  : item
              )
            });
          } else {
            // Temporary item until server responds
            set({
              items: [...currentItems, {
                id: `temp-${Date.now()}`,
                cartItemId: `temp-${Date.now()}`,
                productVariantId: variantId,
                productId: '',
                name: 'Loading...',
                price: 0,
                quantity: qty,
                image: '/placeholder.jpg',
                sku: '',
                inStock: 0
              }]
            });
          }

          const result = await cartActions.addCartItem({ productVariantId: variantId, quantity: qty });

          if (result.success) {
            await get().syncWithServer();
            const addedItem = get().items.find(item => item.productVariantId === variantId);
            if (addedItem) {
              set({ lastAddedItem: addedItem });
            }
          } else {
            toast.error('No se pudo agregar al carrito');
            await get().syncWithServer(); // Revert on error
          }
        } catch (error) {
          console.error('Add item failed:', error);
          toast.error('No se pudo agregar al carrito');
          await get().syncWithServer(); // Revert on error
        } finally {
          set({ isLoading: false });
        }
      },

      async updateQuantity(variantId: string, qty: number) {
        if (qty <= 0) return get().removeItem(variantId);

        set({ isLoading: true });
        try {
          // Optimistic update
          set({
            items: get().items.map(item =>
              item.productVariantId === variantId ? { ...item, quantity: qty } : item
            )
          });

          const result = await cartActions.updateCartItem({ productVariantId: variantId, quantity: qty });

          if (result.success) {
            toast.success('Cantidad Actualizada');
          } else {
            toast.error(result.error || 'No se pudo actualizar la cantidad');
            await get().syncWithServer(); // Revert on error
          }
        } catch (error) {
          console.error('No se pudo actualizar la cantidad:', error);
          toast.error('No se pudo actualizar la cantidad');
          await get().syncWithServer(); // Revert on error
        } finally {
          set({ isLoading: false });
        }
      },

      async removeItem(variantId: string) {
        set({ isLoading: true });
        try {
          // Optimistic update
          set({ items: get().items.filter(item => item.productVariantId !== variantId) });

          const result = await cartActions.removeCartItem(variantId);

          if (result.success) {
            toast.success('Producto eliminado');
          } else {
            toast.error(result.error || 'No se pudo eliminar el producto');
            await get().syncWithServer(); // Revert on error
          }
        } catch (error) {
          console.error('Remove item failed:', error);
          toast.error('No se pudo eliminar el producto');
          await get().syncWithServer(); // Revert on error
        } finally {
          set({ isLoading: false });
        }
      },

      async clear() {
        set({ isLoading: true });
        try {
          // Optimistic update
          set({ items: [] });

          const result = await cartActions.clearCart();

          if (result.success) {
            toast.success('Cart cleared');
          } else {
            toast.error(result.error || 'Error al limpiar el carrito');
            await get().syncWithServer(); // Revert on error
          }
        } catch (error) {
          console.error('Clear cart failed:', error);
          toast.error('No se pudo limpiar el carrito');
          await get().syncWithServer(); // Revert on error
        } finally {
          set({ isLoading: false });
        }
      },

      async syncWithServer() {
        try {
          const result = await cartActions.getCart();
          if (result.success) {
            set({ items: result.data.items });
          }
        } catch (error) {
          console.error('Sync failed:', error);
          toast.error('Failed to sync cart');
        }
      },

      async mergeGuestCart(userId: string) {
        set({ isLoading: true });
        try {
          // Get the guest session token
          const { sessionToken } = await guestSession();

          if (sessionToken) {
            // Merge the guest cart with the user cart
            const result = await cartActions.mergeCarts(sessionToken, userId);

            if (result.success) {
              // Sync with server to get the updated cart
              await get().syncWithServer();
              toast.success('carrito fusionado');
            } else {
              toast.error(result.error || 'Error al fusionar carrito');
            }
          } else {
            // No guest session, just sync with server
            await get().syncWithServer();
          }
        } catch (error) {
          console.error('Merge cart failed:', error);
          toast.error('No se pudo Fusionar el carrito');
        } finally {
          set({ isLoading: false });
        }

      },
      clearAfterCheckout: () => {
        set({ items: [], isInitialized: false, lastAddedItem: null });
        localStorage.removeItem('cart-storage');
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);
