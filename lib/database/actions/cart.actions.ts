"use server";

import { handleError } from "@/lib/utils";

// Note: MongoDB cart saving has been removed in favor of client-side only cart management
// Cart data is now stored in Redis + localStorage only

// Legacy function - now returns empty result for backward compatibility
export async function saveCartForUser(cart: any, clerkId: string) {
  console.warn("saveCartForUser: MongoDB cart saving has been disabled. Use client-side cart management instead.");
  return { success: true, message: "Cart management moved to client-side storage" };
}

// Legacy function - now returns empty cart for backward compatibility  
export async function getSavedCartForUser(clerkId: string) {
  console.warn("getSavedCartForUser: MongoDB cart retrieval has been disabled. Use client-side cart management instead.");
  return {
    success: true,
    user: null,
    cart: { products: [], cartTotal: 0 },
    cartItems: [],
    address: {},
  };
}

// Legacy function - now returns empty result for backward compatibility
export async function updateCartForUser(products: any) {
  console.warn("updateCartForUser: MongoDB cart updates have been disabled. Use client-side cart management instead.");
  return {
    success: true,
    message: "Cart management moved to client-side storage",
    data: products || [],
  };
}
