"use client";

import { useAuth } from "@clerk/nextjs";
import { useCartStore } from "@/store/cart";
import { useEffect, useRef } from "react";
import { getSavedCartForUser, saveCartForUser } from "@/lib/database/actions/cart.actions";
import { toast } from "sonner";

const CartManager = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, userId } = useAuth();
  const setAuthenticated = useCartStore((state: any) => state.setAuthenticated);
  const clearCartOnLogout = useCartStore((state: any) => state.clearCartOnLogout);
  const loadSavedCart = useCartStore((state: any) => state.loadSavedCart);
  const markSynced = useCartStore((state: any) => state.markSynced);
  const cart = useCartStore((state: any) => state.cart.cartItems);
  const isAuthenticated = useCartStore((state: any) => state.isAuthenticated);
  const hasChanges = useCartStore((state: any) => state.hasChanges);
  
  const hasLoadedFromDatabase = useRef(false);
  const previousAuthState = useRef(isSignedIn);

  useEffect(() => {
    // Rehydrate cart store from localStorage
    useCartStore.persist.rehydrate();
  }, []);

  // Handle authentication state changes - sync only on login/logout when needed
  useEffect(() => {
    const handleAuthChange = async () => {
      if (isSignedIn && userId) {
        // User just logged in
        if (!previousAuthState.current) {
          setAuthenticated(true);
          
          // Load from database only on login and only if we haven't loaded before
          if (!hasLoadedFromDatabase.current) {
            try {
              const savedCartResponse = await getSavedCartForUser(userId);
              if (savedCartResponse.success) {
                if (savedCartResponse.cartItems.length > 0) {
                  // Only show notification if we're actually restoring items from database
                  if (cart.length === 0) {
                    loadSavedCart(savedCartResponse.cartItems);
                    toast.success(`Welcome back! Your cart has been restored with ${savedCartResponse.cartItems.length} items.`);
                  } else {
                    // User has local cart, just load silently (don't override local changes)
                    console.log("Local cart exists, keeping local changes");
                  }
                } else {
                  // Database has empty cart or no cart
                  console.log("Database cart is empty, user will start with clean cart");
                  if (cart.length > 0) {
                    console.log("Local cart has items but database is empty - keeping local cart");
                  }
                }
              }
              hasLoadedFromDatabase.current = true;
            } catch (error) {
              console.error("Error loading saved cart:", error);
            }
          }
        } else {
          // User was already logged in, just set authenticated
          setAuthenticated(true);
        }
      } else {
        // User logged out - save to database ONLY if there are changes
        if (previousAuthState.current && isAuthenticated && hasChanges && userId) {
          try {
            await saveCartForUser(cart, userId);
            markSynced(); // Mark as synced after successful save
            if (cart.length === 0) {
              console.log("Empty cart saved to database on logout (cart was cleared)");
            } else {
              console.log(`Cart with ${cart.length} items saved to database on logout`);
            }
          } catch (error) {
            console.error("Error saving cart on logout:", error);
          }
        } else if (previousAuthState.current && isAuthenticated) {
          console.log("No cart changes detected, skipping database save on logout");
        }
        
        clearCartOnLogout();
        hasLoadedFromDatabase.current = false;
      }
      
      previousAuthState.current = isSignedIn;
    };

    handleAuthChange();
  }, [isSignedIn, userId, setAuthenticated, clearCartOnLogout, loadSavedCart, markSynced, cart, isAuthenticated, hasChanges]);

  return <>{children}</>;
};

export default CartManager; 