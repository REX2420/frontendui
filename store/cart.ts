import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

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
  vendor?: any;
  createdAt?: string;
  updatedAt?: string;
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
  
  // Actions
  addToCart: (item: CartItem) => boolean;
  updateCart: (newCartItems: CartItem[]) => boolean;
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
  removeFromCart: (itemId: string) => boolean;
  updateItemQuantity: (itemId: string, qty: number) => boolean;
  // New methods for cart persistence
  saveCartToServer: (userId: string) => Promise<boolean>;
  restoreCartFromServer: (userId: string) => Promise<boolean>;
  mergeGuestCartWithUser: (userId: string) => Promise<boolean>;
  handleLogout: () => Promise<void>;
  handleLogin: (userId: string) => Promise<void>;
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
        set(() => ({
          isAuthenticated: false,
          hasChanges: false,
        }));
      },

      loadSavedCart: (savedCartItems: CartItem[]) => {
        const currentState = get();
        const currentItems = currentState.cart.cartItems;
        
        // Only load if local cart is empty
        if (currentItems.length === 0 && savedCartItems.length > 0) {
          set(() => ({
            cart: {
              cartItems: savedCartItems.map(item => ({
                ...item,
                qty: Number(item.qty), // Ensure qty is always a number
                price: Number(item.price), // Ensure price is always a number
              })),
            },
            hasChanges: false,
          }));
        }
      },

      markSynced: () => {
        set(() => ({
          hasChanges: false,
        }));
      },

      // Enhanced cart persistence methods
      saveCartToServer: async (userId: string): Promise<boolean> => {
        try {
          const currentState = get();
          if (currentState.cart.cartItems.length === 0) {
            return true; // Nothing to save
          }

          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              items: currentState.cart.cartItems,
              operation: 'SYNC_CART'
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            get().markSynced();
            console.log('🔥 Cart saved to server for user:', userId);
            return true;
          } else {
            console.warn('⚠️ Failed to save cart to server:', result.message);
            return false;
          }
        } catch (error) {
          console.error('❌ Error saving cart to server:', error);
          return false;
        }
      },

      restoreCartFromServer: async (userId: string): Promise<boolean> => {
        try {
          const response = await fetch(`/api/cart?userId=${userId}`, {
            method: 'GET',
          });

          const result = await response.json();
          
          if (result.success && result.cart && result.cart.items.length > 0) {
            const currentState = get();
            
            // If user has a local cart, we need to merge, not overwrite
            if (currentState.cart.cartItems.length > 0) {
              console.log('🔄 User has local cart, merging with server cart');
              return await get().mergeGuestCartWithUser(userId);
            } else {
              // Load server cart directly
              set(() => ({
                cart: {
                  cartItems: result.cart.items.map((item: CartItem) => ({
                    ...item,
                    qty: Number(item.qty),
                    price: Number(item.price),
                  })),
                },
                hasChanges: false,
              }));
              
              console.log('🔥 Cart restored from server for user:', userId);
              return true;
            }
          } else {
            console.log('💾 No server cart found for user:', userId);
            return false;
          }
        } catch (error) {
          console.error('❌ Error restoring cart from server:', error);
          return false;
        }
      },

      mergeGuestCartWithUser: async (userId: string): Promise<boolean> => {
        try {
          const currentState = get();
          const localItems = currentState.cart.cartItems;
          
          if (localItems.length === 0) {
            // No local cart to merge, just restore from server
            return await get().restoreCartFromServer(userId);
          }

          // Get server cart
          const response = await fetch(`/api/cart?userId=${userId}`, {
            method: 'GET',
          });

          const result = await response.json();
          let serverItems: CartItem[] = [];
          
          if (result.success && result.cart && result.cart.items) {
            serverItems = result.cart.items;
          }

          // Merge logic: local cart takes priority for quantities
          const mergedItems: CartItem[] = [...localItems];
          
          serverItems.forEach(serverItem => {
            const existingIndex = mergedItems.findIndex(item => item._uid === serverItem._uid);
            
            if (existingIndex === -1) {
              // Item doesn't exist in local cart, add it
              mergedItems.push({
                ...serverItem,
                qty: Number(serverItem.qty),
                price: Number(serverItem.price),
              });
            }
            // If item exists in local cart, keep local version (user's recent activity)
          });

          // Update cart and save to server
          set(() => ({
            cart: {
              cartItems: mergedItems,
            },
            hasChanges: true,
          }));

          // Save merged cart to server
          await get().saveCartToServer(userId);
          
          const totalItems = mergedItems.length;
          const localCount = localItems.length;
          const serverCount = serverItems.length;
          
          if (serverCount > 0) {
            toast.success(`Cart merged! ${totalItems} total items (${localCount} local + ${serverCount} from server)`);
          }
          
          console.log('🔄 Cart merge completed:', { local: localCount, server: serverCount, total: totalItems });
          return true;
          
        } catch (error) {
          console.error('❌ Error merging carts:', error);
          toast.error('Failed to merge cart data');
          return false;
        }
      },

      handleLogout: async (): Promise<void> => {
        const currentState = get();
        
        // If user has cart items and was authenticated, try to save to server first
        if (currentState.isAuthenticated && currentState.cart.cartItems.length > 0) {
          console.log('💾 Saving cart before logout...');
          // Note: We don't have userId here, so we'll rely on the auth state in API
          try {
            await fetch('/api/cart', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                items: currentState.cart.cartItems,
                operation: 'SYNC_CART'
              }),
            });
          } catch (error) {
            console.warn('⚠️ Failed to save cart on logout:', error);
          }
        }
        
        // Clear authentication but keep cart in localStorage for potential restoration
        set(() => ({
          isAuthenticated: false,
          hasChanges: false,
        }));
        
        console.log('👋 User logged out, cart preserved in localStorage');
      },

      handleLogin: async (userId: string): Promise<void> => {
        console.log('👋 User logging in, attempting cart restoration...');
        
        // Set authenticated first
        set(() => ({
          isAuthenticated: true,
        }));
        
        // Try to restore/merge cart from server
        const currentState = get();
        const hasLocalCart = currentState.cart.cartItems.length > 0;
        
        if (hasLocalCart) {
          console.log('🔄 User has local cart, merging with server...');
          await get().mergeGuestCartWithUser(userId);
        } else {
          console.log('🔥 No local cart, restoring from server...');
          const restored = await get().restoreCartFromServer(userId);
          
          if (!restored) {
            console.log('💾 No server cart found, starting fresh');
          }
        }
      },

      addToCart: (item: CartItem) => {
        const currentState = get();
        if (!currentState.isAuthenticated) {
          toast.error("Please login to add items to your cart");
          return false;
        }

        // Validate item data
        if (!item._id || !item._uid || !item.size || item.qty <= 0) {
          toast.error("Invalid item data");
          return false;
        }

        // Check if item already exists
        const existingItems = currentState.cart.cartItems;
        const existingIndex = existingItems.findIndex(i => i._uid === item._uid);

        if (existingIndex >= 0) {
          // Update existing item
          const updatedItems = existingItems.map((cartItem, index) => 
            index === existingIndex 
              ? { 
                  ...cartItem, 
                  qty: Number(item.qty),
                  updatedAt: new Date().toISOString()
                }
              : cartItem
          );

          set(() => ({
            cart: { cartItems: updatedItems },
            hasChanges: true,
          }));
        } else {
          // Add new item
          const newItem: CartItem = {
            ...item,
            qty: Number(item.qty),
            price: Number(item.price),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            cart: {
              cartItems: [...state.cart.cartItems, newItem],
            },
            hasChanges: true,
          }));
        }

        toast.success("Item added to cart successfully");
        return true;
      },

      updateCart: (newCartItems: CartItem[]) => {
        const currentState = get();
        if (!currentState.isAuthenticated) {
          toast.error("Please login to modify your cart");
          return false;
        }

        // Validate and sanitize cart items
        const validatedItems = newCartItems
          .filter(item => item._id && item._uid && item.qty > 0)
          .map(item => ({
            ...item,
            qty: Number(item.qty),
            price: Number(item.price),
            updatedAt: new Date().toISOString(),
          }));

        set(() => ({
          cart: {
            cartItems: validatedItems,
          },
          hasChanges: true,
        }));

        return true;
      },

      removeFromCart: (itemId: string) => {
        const currentState = get();
        if (!currentState.isAuthenticated) {
          toast.error("Please login to modify your cart");
          return false;
        }

        const updatedItems = currentState.cart.cartItems.filter(item => item._uid !== itemId);
        
        set(() => ({
          cart: {
            cartItems: updatedItems,
          },
          hasChanges: true,
        }));

        toast.success("Item removed from cart");
        return true;
      },

      updateItemQuantity: (itemId: string, qty: number) => {
        const currentState = get();
        if (!currentState.isAuthenticated) {
          toast.error("Please login to modify your cart");
          return false;
        }

        if (qty <= 0) {
          return get().removeFromCart(itemId);
        }

        const updatedItems = currentState.cart.cartItems.map(item =>
          item._uid === itemId
            ? { ...item, qty: Number(qty), updatedAt: new Date().toISOString() }
            : item
        );

        set(() => ({
          cart: {
            cartItems: updatedItems,
          },
          hasChanges: true,
        }));

        return true;
      },

      emptyCart: () => {
        set(() => ({
          cart: {
            cartItems: [],
          },
          hasChanges: true,
        }));
        
        toast.success("Cart cleared");
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
          toast.success("Cart restored from backup");
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
          (total: number, item: CartItem) => total + (Number(item.price) * Number(item.qty)),
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
          (count: number, item: CartItem) => count + Number(item.qty),
          0
        );
      },
    }),
    {
      name: "vibecart-storage",
      skipHydration: true,
    }
  )
);
