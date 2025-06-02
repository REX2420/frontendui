"use client";

import { useCartSync } from "@/hooks/useCartSync";

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  // Initialize cart synchronization globally
  useCartSync();
  
  return <>{children}</>;
}; 