"use client";
import { useStore, useAtom } from "jotai";
import { Grid, Home, Menu, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  hamburgerMenuState,
  cartMenuState,
  accountMenuState,
} from "./navbar/store";
import { useAuth } from "@clerk/nextjs";
import { useCartStore } from "@/store/cart";

const MobileBottomBar = () => {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  
  const getCartItemCount = useCartStore((state: any) => state.getCartItemCount);
  const isAuthenticated = useCartStore((state: any) => state.isAuthenticated);
  
  const [hamMenuOpen, setHamMenuOpen] = useAtom(hamburgerMenuState, {
    store: useStore(),
  });
  const [cartMenuOpen, setCartMenuOpen] = useAtom(cartMenuState, {
    store: useStore(),
  });
  const [accountMenuOpen, setAccountMenuOpen] = useAtom(accountMenuState, {
    store: useStore(),
  });

  const handleOnClickHamburgerMenu = () => {
    setHamMenuOpen(true);
    console.log("ham", hamMenuOpen);
  };
  const handleOnClickCartMenu = () => {
    setCartMenuOpen(true);
    console.log("cart", cartMenuOpen);
  };
  const handleOnClickAccountMenu = () => {
    setAccountMenuOpen(true);
    console.log("acc", accountMenuOpen);
  };

  // Helper function to determine if a route is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border md:hidden z-50 shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center transition-colors min-w-0 flex-1 py-2 ${
            isActive("/") 
              ? "text-orange-500" 
              : "text-muted-foreground hover:text-orange-500"
          }`}
        >
          <Home size={22} />
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>
        <button
          onClick={handleOnClickHamburgerMenu}
          className={`flex flex-col items-center justify-center transition-colors min-w-0 flex-1 py-2 ${
            hamMenuOpen
              ? "text-orange-500"
              : "text-muted-foreground hover:text-orange-500"
          }`}
        >
          <Grid size={22} />
          <span className="text-xs mt-1 font-medium">Categories</span>
        </button>
        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center transition-colors min-w-0 flex-1 py-2 ${
            isActive("/shop")
              ? "text-orange-500"
              : "text-muted-foreground hover:text-orange-500"
          }`}
        >
          <ShoppingBag size={22} />
          <span className="text-xs mt-1 font-medium">Shop</span>
        </Link>
        <button
          onClick={handleOnClickCartMenu}
          className={`flex flex-col items-center justify-center transition-colors min-w-0 flex-1 py-2 relative ${
            cartMenuOpen
              ? "text-orange-500"
              : "text-muted-foreground hover:text-orange-500"
          }`}
        >
          <ShoppingBag size={22} />
          {isSignedIn && isAuthenticated && getCartItemCount() > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-orange-500 rounded-full min-w-[18px]">
              {getCartItemCount()}
            </span>
          )}
          <span className="text-xs mt-1 font-medium">Cart</span>
        </button>
        <button
          onClick={handleOnClickAccountMenu}
          className={`flex flex-col items-center justify-center transition-colors min-w-0 flex-1 py-2 ${
            accountMenuOpen
              ? "text-orange-500"
              : "text-muted-foreground hover:text-orange-500"
          }`}
        >
          <User size={22} />
          <span className="text-xs mt-1 font-medium">Account</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomBar;
