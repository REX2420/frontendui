"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import Link from "next/link";
import { useAtom, useStore } from "jotai";
import { Button } from "@/components/ui/button";
import { cartMenuState } from "./store";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useCartSync } from "@/hooks/useCartSync";
import { FaArrowCircleRight } from "react-icons/fa";
import CartSheetItems from "../cart/CartSheetItems";
import { toast } from "sonner";

const CartDrawer = () => {
  const router = useRouter();
  const { userId, isSignedIn } = useAuth();
  
  // Use the cart sync hook for automatic cart persistence
  const { isAuthenticated, cartItemCount } = useCartSync();
  
  const [cartMenuOpen, setCartMenuOpen] = useAtom(cartMenuState, {
    store: useStore(),
  });
  
  const handleOnClickCartMenu = () => {
    setCartMenuOpen(true);
  };
  
  const cart = useCartStore((state: any) => state.cart.cartItems);
  const getCartTotal = useCartStore((state: any) => state.getCartTotal);

  const [loading, setLoading] = useState(false);

  const proceedToCheckout = () => {
    if (!isSignedIn || !isAuthenticated) {
      toast.error("Please login to proceed to checkout");
      router.push("/sign-in?next=checkout");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate cart items
    const invalidItems = cart.filter((item: any) => 
      !item._id || !item.size || !item.qty || item.qty <= 0
    );
    
    if (invalidItems.length > 0) {
      toast.error("Some items in your cart are invalid. Please refresh and try again.");
      return;
    }

    setLoading(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      setLoading(false);
      setCartMenuOpen(false);
      router.push("/checkout");
    }, 500);
  };

  const total = getCartTotal();

  return (
    <div className="relative">
      <Sheet open={cartMenuOpen}>
        <SheetTrigger asChild>
          <Button
            onClick={() => handleOnClickCartMenu()}
            variant={"ghost"}
            size={"icon"}
            className="relative"
          >
            <ShoppingBag size={24} />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
              {cartItemCount}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[90%] max-w-[450px] sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle className="subHeading flex items-center justify-between">
              <span>CART ({cartItemCount} items)</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartMenuOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-4 space-y-4 flex-1 overflow-hidden">
            {!isSignedIn || !isAuthenticated ? (
              <div className="flex justify-center h-[80vh] items-center">
                <div className="text-center">
                  <h1 className="text-2xl mb-4 font-bold">
                    Please Login
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Login to view and manage your cart items
                  </p>
                  <Link href="/sign-in?next=cart">
                    <Button className="flex justify-center items-center w-full gap-2">
                      Login Now
                      <FaArrowCircleRight />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex justify-center h-[80vh] items-center">
                <div className="text-center">
                  <h1 className="text-2xl mb-4 font-bold">
                    Your Cart is Empty
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Add some amazing products to your cart
                  </p>
                  <Link href="/shop">
                    <Button 
                      className="flex justify-center items-center w-full gap-2"
                      onClick={() => setCartMenuOpen(false)}
                    >
                      Shop Now
                      <FaArrowCircleRight />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {cart.map((product: any) => (
                  <CartSheetItems product={product} key={product._uid} />
                ))}
              </div>
            )}
          </div>
          
          {isSignedIn && isAuthenticated && cart.length > 0 && (
            <div className="absolute bottom-2 left-2 right-2 bg-background border-t pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>MVR {total.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tax included. Shipping calculated at checkout.
                </p>
                <Button
                  onClick={proceedToCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full gap-2 h-12"
                >
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      Continue to Secure Checkout - MVR {total.toFixed(2)}
                      <FaArrowCircleRight />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CartDrawer;
