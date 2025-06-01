import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCartStore = create(
  persist(
    (set, get: any) => ({
      cart: {
        cartItems: [],
      },
      cartBackup: {
        cartItems: [],
        timestamp: null,
      },

      addToCart: (item: any) => {
        set((state: any) => ({
          cart: {
            cartItems: [...state.cart.cartItems, item],
          },
        }));
      },

      updateCart: (newCartItems: any) => {
        set((state: any) => ({
          cart: {
            cartItems: newCartItems,
          },
        }));
      },

      emptyCart: () => {
        set(() => ({
          cart: {
            cartItems: [],
          },
        }));
      },

      // Backup cart before payment
      backupCart: () => {
        const currentState = get();
        set((state: any) => ({
          cartBackup: {
            cartItems: [...currentState.cart.cartItems],
            timestamp: new Date().toISOString(),
          },
        }));
      },

      // Restore cart from backup (in case of payment failure)
      restoreCart: () => {
        const currentState = get();
        if (currentState.cartBackup.cartItems.length > 0) {
          set((state: any) => ({
            cart: {
              cartItems: [...currentState.cartBackup.cartItems],
            },
            cartBackup: {
              cartItems: [],
              timestamp: null,
            },
          }));
          return true;
        }
        return false;
      },

      // Clear backup after successful payment
      clearBackup: () => {
        set((state: any) => ({
          cartBackup: {
            cartItems: [],
            timestamp: null,
          },
        }));
      },

      // Get cart total
      getCartTotal: () => {
        const currentState = get();
        return currentState.cart.cartItems.reduce(
          (total: number, item: any) => total + (item.price * item.qty),
          0
        );
      },

      // Get cart item count
      getCartItemCount: () => {
        const currentState = get();
        return currentState.cart.cartItems.reduce(
          (count: number, item: any) => count + item.qty,
          0
        );
      },
    }),
    {
      name: "cart", // name of the item in the storage (must be unique)
      skipHydration: true,
    }
  )
);
