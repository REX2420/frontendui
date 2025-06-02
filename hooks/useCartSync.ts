import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useCartStore } from '@/store/cart';

export const useCartSync = () => {
  const { isSignedIn, userId } = useAuth();
  const prevAuthState = useRef<{ isSignedIn: boolean; userId: string | null }>({
    isSignedIn: false,
    userId: null,
  });

  useEffect(() => {
    const handleAuthChange = async () => {
      const handleLogin = useCartStore.getState().handleLogin;
      const handleLogout = useCartStore.getState().handleLogout;
      const currentAuth = useCartStore.getState().isAuthenticated;
      
      const prev = prevAuthState.current;
      const curr = { isSignedIn: !!isSignedIn, userId: userId || null };
      
      // Check if authentication state actually changed
      if (prev.isSignedIn !== curr.isSignedIn || prev.userId !== curr.userId) {
        if (curr.isSignedIn && curr.userId && !currentAuth) {
          // User just logged in
          console.log('🔐 User logged in, restoring cart...');
          await handleLogin(curr.userId);
        } else if (!curr.isSignedIn && currentAuth) {
          // User just logged out
          console.log('👋 User logged out, saving cart...');
          await handleLogout();
        }
        
        // Update previous state
        prevAuthState.current = curr;
      }
    };

    handleAuthChange();
  }, [isSignedIn, userId]);

  // Periodic cart sync for authenticated users
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const syncCart = async () => {
      const saveCartToServer = useCartStore.getState().saveCartToServer;
      const hasChanges = useCartStore.getState().hasChanges;
      
      if (hasChanges) {
        console.log('🔄 Syncing cart changes to server...');
        await saveCartToServer(userId);
      }
    };

    // Sync cart every 30 seconds if there are changes
    const interval = setInterval(syncCart, 30000);
    
    // Sync on page visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncCart();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn, userId]);

  // Sync cart before page unload
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const handleBeforeUnload = async () => {
      const saveCartToServer = useCartStore.getState().saveCartToServer;
      const hasChanges = useCartStore.getState().hasChanges;
      
      if (hasChanges) {
        // Use sendBeacon for reliable sync on page unload
        navigator.sendBeacon('/api/cart', JSON.stringify({
          userId,
          items: useCartStore.getState().cart.cartItems,
          operation: 'SYNC_CART'
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSignedIn, userId]);

  return {
    isAuthenticated: useCartStore((state) => state.isAuthenticated),
    cartItemCount: useCartStore((state) => state.getCartItemCount()),
    hasChanges: useCartStore((state) => state.hasChanges),
  };
}; 