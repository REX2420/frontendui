import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SimpleCartManagerService } from "@/lib/services/cart/simple-cart-manager.service";
import { Cart, CartItem, CartOperation } from "@/lib/services/cart/types";

interface EnhancedCartState {
  // Existing state for backward compatibility
  cart: {
    cartItems: CartItem[];
  };
  cartBackup: {
    cartItems: CartItem[];
    timestamp: string | null;
  };
  isAuthenticated: boolean;
  hasChanges: boolean;
  
  // Simplified cart state (Redis + localStorage only)
  isLoading: boolean;
  lastSyncTime: string | null;
  source: 'redis' | 'localStorage' | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  errors: string[];

  // Enhanced actions
  addToCart: (item: CartItem) => Promise<void>;
  updateCart: (newCartItems: CartItem[]) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  emptyCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  syncToServer: () => Promise<void>;
  
  // Backup/restore (for payment flow)
  backupCart: () => void;
  restoreCart: () => boolean;
  clearBackup: () => void;
  
  // Utility functions
  getCartTotal: () => number;
  getCartItemCount: () => number;
  setAuthenticated: (isAuth: boolean) => void;
  clearCartOnLogout: () => void;
  loadSavedCart: (savedCartItems: CartItem[]) => void;
  markSynced: () => void;
  
  // Simplified utility functions
  getStorageHealth: () => Promise<any>;
  getCartStatistics: () => Promise<any>;
  mergeGuestCart: () => Promise<void>;
}

const cartManager = SimpleCartManagerService.getInstance();

export const useEnhancedCartStore = create(
  persist<EnhancedCartState>(
    (set, get) => ({
      // Initial state
      cart: {
        cartItems: [],
      },
      cartBackup: {
        cartItems: [],
        timestamp: null,
      },
      isAuthenticated: false,
      hasChanges: false,
      isLoading: false,
      lastSyncTime: null,
      source: null,
      syncStatus: 'idle',
      errors: [],

      // Enhanced cart operations
      addToCart: async (item: CartItem) => {
        const state = get();
        if (!state.isAuthenticated) {
          console.warn("Cannot add to cart: User not authenticated");
          return;
        }

        set({ isLoading: true, syncStatus: 'syncing' });
        
        try {
          // Use the simple cart manager for the actual operation
          const result = await cartManager.addItem(
            item, 
            state.isAuthenticated ? 'current-user' : undefined
          );

          if (result.success && result.cart) {
            set({
              cart: { cartItems: result.cart.items },
              hasChanges: false, // Already synced
              lastSyncTime: new Date().toISOString(),
              syncStatus: 'success',
              errors: [],
              source: 'redis'
            });
          } else {
            // Fallback to local update
            const newItems = [...state.cart.cartItems];
            const existingIndex = newItems.findIndex(i => i._uid === item._uid);
            
            if (existingIndex >= 0) {
              newItems[existingIndex] = { ...newItems[existingIndex], qty: item.qty };
            } else {
              newItems.push(item);
            }
            
            set({
              cart: { cartItems: newItems },
              hasChanges: true,
              syncStatus: 'error',
              errors: [result.message || 'Failed to sync to server']
            });
          }
        } catch (error) {
          console.error('Enhanced cart addToCart error:', error);
          set({
            syncStatus: 'error',
            errors: ['Network error occurred']
          });
        } finally {
          set({ isLoading: false });
        }
      },

      updateCart: async (newCartItems: CartItem[]) => {
        const state = get();
        if (!state.isAuthenticated) {
          console.warn("Cannot update cart: User not authenticated");
          return;
        }

        set({ isLoading: true, syncStatus: 'syncing' });

        try {
          const result = await cartManager.updateCart(
            { 
              items: newCartItems, 
              userId: state.isAuthenticated ? 'current-user' : undefined 
            },
            CartOperation.UPDATE_ITEM
          );

          if (result.success) {
            set({
              cart: { cartItems: newCartItems },
              hasChanges: false,
              lastSyncTime: new Date().toISOString(),
              syncStatus: 'success',
              errors: []
            });
          } else {
            // Update locally but mark as having changes
            set({
              cart: { cartItems: newCartItems },
              hasChanges: true,
              syncStatus: 'error',
              errors: [result.message || 'Failed to sync to server']
            });
          }
        } catch (error) {
          console.error('Enhanced cart updateCart error:', error);
          set({
            cart: { cartItems: newCartItems },
            hasChanges: true,
            syncStatus: 'error',
            errors: ['Network error occurred']
          });
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromCart: async (itemId: string) => {
        const state = get();
        if (!state.isAuthenticated) {
          console.warn("Cannot remove from cart: User not authenticated");
          return;
        }

        set({ isLoading: true, syncStatus: 'syncing' });

        try {
          const result = await cartManager.removeItem(
            itemId,
            state.isAuthenticated ? 'current-user' : undefined
          );

          if (result.success && result.cart) {
            set({
              cart: { cartItems: result.cart.items },
              hasChanges: false,
              lastSyncTime: new Date().toISOString(),
              syncStatus: 'success',
              errors: []
            });
          } else {
            // Fallback to local removal
            const newItems = state.cart.cartItems.filter(item => item._uid !== itemId);
            set({
              cart: { cartItems: newItems },
              hasChanges: true,
              syncStatus: 'error',
              errors: [result.message || 'Failed to sync to server']
            });
          }
        } catch (error) {
          console.error('Enhanced cart removeFromCart error:', error);
          set({
            syncStatus: 'error',
            errors: ['Network error occurred']
          });
        } finally {
          set({ isLoading: false });
        }
      },

      emptyCart: async () => {
        const state = get();
        set({ isLoading: true, syncStatus: 'syncing' });

        try {
          const result = await cartManager.clearCart(
            state.isAuthenticated ? 'current-user' : undefined
          );

          set({
            cart: { cartItems: [] },
            hasChanges: !result.success,
            lastSyncTime: result.success ? new Date().toISOString() : state.lastSyncTime,
            syncStatus: result.success ? 'success' : 'error',
            errors: result.success ? [] : [result.message || 'Failed to clear cart on server']
          });
        } catch (error) {
          console.error('Enhanced cart emptyCart error:', error);
          set({
            cart: { cartItems: [] },
            hasChanges: true,
            syncStatus: 'error',
            errors: ['Network error occurred']
          });
        } finally {
          set({ isLoading: false });
        }
      },

      loadCart: async () => {
        const state = get();
        set({ isLoading: true, syncStatus: 'syncing' });

        try {
          const result = await cartManager.getCart(
            state.isAuthenticated ? 'current-user' : undefined
          );

          if (result.success && result.cart) {
            set({
              cart: { cartItems: result.cart.items },
              hasChanges: false,
              lastSyncTime: new Date().toISOString(),
              syncStatus: 'success',
              source: result.source as 'redis' | 'localStorage' | null,
              errors: []
            });
          } else {
            set({
              syncStatus: 'error',
              errors: [result.message || 'Failed to load cart']
            });
          }
        } catch (error) {
          console.error('Enhanced cart loadCart error:', error);
          set({
            syncStatus: 'error',
            errors: ['Network error occurred']
          });
        } finally {
          set({ isLoading: false });
        }
      },

      syncToServer: async () => {
        const state = get();
        if (!state.hasChanges || !state.isAuthenticated) return;

        set({ isLoading: true, syncStatus: 'syncing' });

        try {
          const result = await cartManager.updateCart(
            {
              items: state.cart.cartItems,
              userId: 'current-user'
            },
            CartOperation.SYNC_CART
          );

          if (result.success) {
            set({
              hasChanges: false,
              lastSyncTime: new Date().toISOString(),
              syncStatus: 'success',
              errors: []
            });
          } else {
            set({
              syncStatus: 'error',
              errors: [result.message || 'Failed to sync to server']
            });
          }
        } catch (error) {
          console.error('Enhanced cart syncToServer error:', error);
          set({
            syncStatus: 'error',
            errors: ['Network error occurred']
          });
        } finally {
          set({ isLoading: false });
        }
      },

      mergeGuestCart: async () => {
        const state = get();
        if (!state.isAuthenticated) return;

        set({ isLoading: true, syncStatus: 'syncing' });

        try {
          const result = await cartManager.mergeGuestCartOnLogin('current-user');
          
          if (result.success && result.cart) {
            set({
              cart: { cartItems: result.cart.items },
              hasChanges: false,
              lastSyncTime: new Date().toISOString(),
              syncStatus: 'success',
              errors: []
            });
          }
        } catch (error) {
          console.error('Enhanced cart mergeGuestCart error:', error);
          set({
            syncStatus: 'error',
            errors: ['Failed to merge guest cart']
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // Backward compatibility methods
      setAuthenticated: (isAuth: boolean) => {
        set({ isAuthenticated: isAuth });
        if (isAuth) {
          // Load cart when authenticated
          get().loadCart();
        }
      },

      clearCartOnLogout: () => {
        set({
          isAuthenticated: false,
          hasChanges: false,
          source: null,
          syncStatus: 'idle',
          errors: []
        });
      },

      loadSavedCart: (savedCartItems: CartItem[]) => {
        const currentState = get();
        if (currentState.cart.cartItems.length === 0) {
          set({
            cart: { cartItems: savedCartItems },
            hasChanges: false,
            source: 'localStorage'
          });
        }
      },

      markSynced: () => {
        set({
          hasChanges: false,
          lastSyncTime: new Date().toISOString(),
          syncStatus: 'success'
        });
      },

      // Backup/restore for payment flow
      backupCart: () => {
        const currentState = get();
        set({
          cartBackup: {
            cartItems: [...currentState.cart.cartItems],
            timestamp: new Date().toISOString(),
          },
        });
      },

      restoreCart: () => {
        const currentState = get();
        if (currentState.cartBackup.cartItems.length > 0) {
          set({
            cart: { cartItems: [...currentState.cartBackup.cartItems] },
            cartBackup: { cartItems: [], timestamp: null },
            hasChanges: true,
          });
          return true;
        }
        return false;
      },

      clearBackup: () => {
        set({
          cartBackup: { cartItems: [], timestamp: null },
        });
      },

      // Utility functions
      getCartTotal: () => {
        const currentState = get();
        return currentState.cart.cartItems.reduce(
          (total: number, item: CartItem) => total + (item.price * item.qty),
          0
        );
      },

      getCartItemCount: () => {
        const currentState = get();
        if (!currentState.isAuthenticated) return 0;
        return currentState.cart.cartItems.reduce(
          (count: number, item: CartItem) => count + item.qty,
          0
        );
      },

      getStorageHealth: async () => {
        try {
          return await cartManager.getStorageHealth();
        } catch (error) {
          console.error('Failed to get storage health:', error);
          return null;
        }
      },

      getCartStatistics: async () => {
        try {
          return await cartManager.getCartStatistics();
        } catch (error) {
          console.error('Failed to get cart statistics:', error);
          return null;
        }
      },
    }),
    {
      name: "vibecart-enhanced-storage",
      skipHydration: true,
    }
  )
); 