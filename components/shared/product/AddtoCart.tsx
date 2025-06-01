"use client";
import { Button } from "@/components/ui/button";
import { getProductDetailsById } from "@/lib/database/actions/product.actions";
import { useCartStore } from "@/store/cart";
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
  
  console.log(frontendSize);
  
  const addToCart = useCartStore((state: any) => state.addToCart);
  const updateCart = useCartStore((state: any) => state.updateCart);
  const cart = useCartStore((state: any) => state.cart.cartItems);
  const isAuthenticated = useCartStore((state: any) => state.isAuthenticated);
  
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
    
    try {
      const data = await getProductDetailsById(
        product._id,
        product.style,
        frontendSize
      ).catch((err) => alert(err));
      
      if (qty > data.quantity) {
        toast.error("The quantity you have chosen is more than in stock!");
        return;
      } 
      
      if (data.quantity < 1) {
        toast.error("The quantity you have chosen is more than in stock!");
        return;
      } 
      
      let _uid = `${data._id}_${product.style}_${frontendSize}`;
      let exist: any = cart.find((p: any) => p._uid === _uid);
      
      if (exist) {
        const updatedCart = cart.map((p: any) => {
          if (p._uid == exist._uid) {
            return { ...p, qty: qty };
          }
          return p;
        });
        updateCart(updatedCart);
        toast(
          <div className="flex justify-between items-center gap-[20px] ">
            <Image src={data.images[0].url} alt="_" height={50} width={50} />
            <div className="flex items-center justify-between text-xl text-white">
              <span>Product updated successfully</span>{" "}
              <span>
                <FaCheckCircle size={20} />
              </span>
            </div>
          </div>,
          { style: { backgroundColor: "black" } }
        );
      } else {
        const newItem = {
          ...data,
          qty,
          size: data.size,
          _uid,
        };
        addToCart(newItem);
        toast(
          <div className="flex justify-between items-center gap-[20px] ">
            <Image src={data.images[0].url} alt="_" height={40} width={40} />
            <div className="flex gap-[10px] items-center justify-between text-xl text-white">
              <span>Product added to cart</span>{" "}
              <span>
                <FaCheckCircle size={20} />
              </span>
            </div>
          </div>,
          { style: { backgroundColor: "black" } }
        );
      }
      
    } catch (error) {
      handleError(error);
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
        {!isSignedIn || !isAuthenticated ? "LOGIN TO ADD TO CART" : "ADD TO CART"}
      </Button>
    </div>
  );
};

export default AddtoCartButton;
