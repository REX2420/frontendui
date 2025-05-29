"use client";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import React, { useEffect } from "react";
import { quantityState } from "../jotai/store";
import { useAtom, useStore } from "jotai";

const QtyButtons = ({
  product,
  size,
  style,
}: {
  product: any;
  size: number;
  style: number;
}) => {
  const [qty, setQty] = useAtom(quantityState, {
    store: useStore(),
  });
  
  useEffect(() => {
    setQty(1);
  }, [style]);
  
  useEffect(() => {
    if (qty > product.quantity) {
      setQty(product.quantity);
    }
  }, [size]);

  const handleDecrease = () => {
    if (qty > 1) {
      setQty((prev) => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (qty < product.quantity) {
      setQty((prev) => prev + 1);
    }
  };

  const isOutOfStock = product.quantity < 1;
  const isMinQuantity = qty <= 1;
  const isMaxQuantity = qty >= product.quantity;

  return (
    <div className="space-y-4">
      {/* Quantity Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          Quantity
        </label>
        {!isOutOfStock && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {product.quantity} available
          </span>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="relative">
        {!isOutOfStock ? (
          <div className="flex items-center bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 overflow-hidden">
            {/* Decrease Button */}
            <button
              onClick={handleDecrease}
              disabled={isMinQuantity}
              className={`
                flex items-center justify-center w-12 h-12 transition-all duration-200 ease-in-out
                ${isMinQuantity
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" 
                  : "text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 active:scale-95"
                }
              `}
              aria-label="Decrease quantity"
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Quantity Display */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-50/0 via-orange-50/50 to-orange-50/0 dark:from-orange-900/0 dark:via-orange-900/10 dark:to-orange-900/0"></div>
              <span className="relative text-lg font-semibold text-gray-900 dark:text-white min-w-[3rem] text-center py-3 px-2">
                {qty}
              </span>
            </div>

            {/* Increase Button */}
            <button
              onClick={handleIncrease}
              disabled={isMaxQuantity}
              className={`
                flex items-center justify-center w-12 h-12 transition-all duration-200 ease-in-out
                ${isMaxQuantity
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed" 
                  : "text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 active:scale-95"
                }
              `}
              aria-label="Increase quantity"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-12 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
            <span className="text-red-600 dark:text-red-400 font-medium text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Additional Info */}
      {!isOutOfStock && qty === product.quantity && product.quantity <= 5 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>You've selected the maximum available quantity</span>
        </div>
      )}
    </div>
  );
};

export default QtyButtons;
