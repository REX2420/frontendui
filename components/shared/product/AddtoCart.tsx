"use client";
import { Button } from "@/components/ui/button";
import { getProductDetailsById } from "@/lib/database/actions/product.actions";
import { useCartStore } from "@/store/cart";
import { useCartSync } from "@/hooks/useCartSync";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { FaCheckCircle } from "react-icons/fa";
import { useAtom, useStore } from "jotai";
import { quantityState } from "../jotai/store";
import { handleError } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const AddtoCartButton = ({ product, size }: { product: any; size: number }) => {
  const frontendSize = useSearchParams().get("size");
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  
  // Use the cart sync hook for automatic cart persistence
  const { isAuthenticated } = useCartSync();
  
  const addToCart = useCartStore((state: any) => state.addToCart);
  
  const [qty, setQty] = useAtom(quantityState, {
    store: useStore(),
  });
  
  const addtoCartHandler = async () => {
    // First check if user is logged in
    if (!isSignedIn || !userId || !isAuthenticated) {
      toast.error("Please login to add items to your cart", {
        style: { backgroundColor: "#FBE0E2" },
        action: {
          label: "Login",
          onClick: () => router.push("/sign-in")
        }
      });
      return;
    }

    if (frontendSize === null) {
      toast.error("Please select the size!", {
        style: { backgroundColor: "#FBE0E2" },
      });
      return;
    }

    if (!qty || qty <= 0) {
      toast.error("Please select a valid quantity!");
      return;
    }
    
    try {
      const data = await getProductDetailsById(
        product._id,
        product.style,
        frontendSize
      ).catch((err) => {
        console.error("Product details error:", err);
        throw new Error("Failed to get product details");
      });
      
      if (qty > data.quantity) {
        toast.error("The quantity you have chosen is more than in stock!");
        return;
      } 
      
      if (data.quantity < 1) {
        toast.error("This item is out of stock!");
        return;
      } 
      
      const _uid = `${data._id}_${product.style}_${frontendSize}`;
      
      const newItem = {
        _id: data._id,
        _uid,
        name: data.name,
        price: Number(data.price),
        qty: Number(qty),
        size: data.size,
        images: data.images || [],
        quantity: Number(data.quantity),
        discount: data.discount || 0,
        style: product.style,
        color: data.color || { color: "", image: "" },
        vendor: data.vendor || {},
      };

      const success = addToCart(newItem);
      
      if (success) {
        toast(
          <div className="flex justify-between items-center gap-[20px]">
            <Image 
              src={data.images[0]?.url || data.images[0] || "/placeholder.jpg"} 
              alt={data.name} 
              height={40} 
              width={40}
              className="rounded"
            />
            <div className="flex gap-[10px] items-center justify-between text-xl text-white">
              <span>Product added to cart</span>
              <span>
                <FaCheckCircle size={20} />
              </span>
            </div>
          </div>,
          { style: { backgroundColor: "black" } }
        );
      }
      
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add product to cart. Please try again.");
    }
  };

  return (
    <div>
      <Button
        onClick={() => addtoCartHandler()}
        disabled={product.quantity < 1 || qty === 0 || size === null}
        style={{ cursor: `${product.quantity < 1 ? "not-allowed" : ""}` }}
        className="w-full bg-orange-600 text-white hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed py-[30px] font-semibold text-lg transition-colors duration-200"
      >
        {!isSignedIn || !isAuthenticated ? "LOGIN TO ADD TO CART" : 
         product.quantity < 1 ? "OUT OF STOCK" : "ADD TO CART"}
      </Button>
    </div>
  );
};

export default AddtoCartButton;
