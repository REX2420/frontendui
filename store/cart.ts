import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  _id: string;
  _uid: string;
  name: string;
  price: number;
  qty: number;
  size: string;
  images: any[];
  quantity: number;
  discount?: number;
  style?: number;
  color?: {
    color: string;
    image: string;
  };
}

interface CartState {
  cart: {
    cartItems: CartItem[];
  };
  cartBackup: {
    cartItems: CartItem[];
    timestamp: string | null;
  };
  isAuthenticated: boolean;
  hasChanges: boolean;
  addToCart: (item: CartItem) => void;
  updateCart: (newCartItems: CartItem[]) => void;
  emptyCart: () => void;
  backupCart: () => void;
  restoreCart: () => boolean;
  clearBackup: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  setAuthenticated: (isAuth: boolean) => void;
  clearCartOnLogout: () => void;
  loadSavedCart: (savedCartItems: CartItem[]) => void;
  markSynced: () => void;
}

export const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: {
        cartItems: [],
      },
      cartBackup: {
        cartItems: [],
        timestamp: null,
      },
      isAuthenticated: false,
      hasChanges: false,

      setAuthenticated: (isAuth: boolean) => {
        set(() => ({
          isAuthenticated: isAuth,
        }));
      },

      clearCartOnLogout: () => {
        // Keep cart in localStorage but mark as unauthenticated
        set(() => ({
          isAuthenticated: false,
        }));
      },

      loadSavedCart: (savedCartItems: CartItem[]) => {
        const currentState = get();
        const currentItems = currentState.cart.cartItems;
        
        // Only load if local cart is empty
        if (currentItems.length === 0) {
          set(() => ({
            cart: {
              cartItems: savedCartItems,
            },
            hasChanges: false,
          }));
        } else {
          // Local cart exists, keep local changes
          console.log("Local cart exists, keeping local changes");
        }
      },

      markSynced: () => {
        set(() => ({
          hasChanges: false,
        }));
      },

      addToCart: (item: CartItem) => {
        const currentState = get();
        if (!currentState.isAuthenticated) {
          console.warn("Cannot add to cart: User not authenticated");
          return;
        }

        set((state) => ({
          cart: {
            cartItems: [...state.cart.cartItems, item],
          },
          hasChanges: true,
        }));
        
        console.log("Cart modified: Item added, hasChanges = true");
      },

      updateCart: (newCartItems: CartItem[]) => {
        const currentState = get();
        if (!currentState.isAuthenticated) {
          console.warn("Cannot update cart: User not authenticated");
          return;
        }

        set(() => ({
          cart: {
            cartItems: newCartItems,
          },
          hasChanges: true,
        }));
        
        console.log("Cart modified: Items updated, hasChanges = true");
      },

      emptyCart: () => {
        set(() => ({
          cart: {
            cartItems: [],
          },
          hasChanges: true,
        }));
        
        console.log("Cart modified: Cart emptied, hasChanges = true");
      },

      // Backup cart before payment
      backupCart: () => {
        const currentState = get();
        set(() => ({
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
          set(() => ({
            cart: {
              cartItems: [...currentState.cartBackup.cartItems],
            },
            cartBackup: {
              cartItems: [],
              timestamp: null,
            },
            hasChanges: true,
          }));
          return true;
        }
        return false;
      },

      // Clear backup after successful payment
      clearBackup: () => {
        set(() => ({
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
          (total: number, item: CartItem) => total + (item.price * item.qty),
          0
        );
      },

      // Get cart item count
      getCartItemCount: () => {
        const currentState = get();
        if (!currentState.isAuthenticated) {
          return 0;
        }
        return currentState.cart.cartItems.reduce(
          (count: number, item: CartItem) => count + item.qty,
          0
        );
      },
    }),
    {
      name: "vibecart-storage", // localStorage key
      skipHydration: true,
    }
  )
);
