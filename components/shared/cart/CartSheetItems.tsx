import { useCartStore } from "@/store/cart";
import { Minus, Plus, X } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

const CartSheetItems = ({ product }: { product: any }) => {
  const { isSignedIn, userId } = useAuth();
  
  const updateItemQuantity = useCartStore((state: any) => state.updateItemQuantity);
  const removeFromCart = useCartStore((state: any) => state.removeFromCart);

  const updateQty = async (type: string) => {
    if (!isSignedIn) {
      toast.error("Please login to modify cart items");
      return;
    }

    const newQty = type === "plus" ? product.qty + 1 : product.qty - 1;
    
    if (newQty <= 0) {
      removeFromCart(product._uid);
      return;
    }

    if (newQty > product.quantity) {
      toast.error("Cannot exceed available stock");
      return;
    }

    const success = updateItemQuantity(product._uid, newQty);
    if (success) {
      toast.success("Cart updated successfully");
    }
  };
  
  const removeProduct = async (id: string) => {
    if (!isSignedIn) {
      toast.error("Please login to remove cart items");
      return;
    }

    const success = removeFromCart(id);
    if (success) {
      toast.success("Item removed successfully");
    }
  };

  return (
    <div>
      <div
        key={product._uid}
        className="flex items-start space-x-4 border-b-2 pb-3"
      >
        <img
          src={product.images[0]?.url || product.images[0]}
          alt={product.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
        />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-xs sm:text-sm tracking-wide ">
              {product.name}{" "}
              {product.size && (
                <span className="font-[600]">({product.size})</span>
              )}
            </h3>
            <button
              onClick={() => removeProduct(product._uid)}
              className="text-red-500 hover:text-red-700 p-1"
              disabled={!isSignedIn}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1">
            {product.discount > 0 && (
              <span className="text-green-500 text-xs sm:text-sm px-2 py-1 bg-green-50 rounded-full">
                -{product.discount}% OFF
              </span>
            )}
            <p className="text-xs sm:text-sm text-gray-500">
              Buy More Save More
            </p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border rounded-lg">
              <button
                disabled={product.qty <= 1 || !isSignedIn}
                onClick={() => updateQty("minus")}
                className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm font-medium">{product.qty}</span>
              <button
                disabled={product.qty >= product.quantity || !isSignedIn}
                onClick={() => updateQty("plus")}
                className="p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="font-semibold text-xs sm:text-base">
                MVR {Number(product.price).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                Stock: {product.quantity}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSheetItems;
