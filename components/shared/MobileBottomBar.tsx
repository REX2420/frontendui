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

const MobileBottomBar = () => {
  const pathname = usePathname();
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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden">
      <div className="flex justify-around items-center h-16">
        <Link
          href="/"
          className={`flex flex-col items-center transition-colors ${
            isActive("/") 
              ? "text-orange-500" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home size={24} />
          <span className="text-xs">Home</span>
        </Link>
        <button
          onClick={handleOnClickHamburgerMenu}
          className={`flex flex-col items-center transition-colors ${
            hamMenuOpen
              ? "text-orange-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid size={24} />
          <span className="text-xs">Categories</span>
        </button>
        <Link
          href="/shop"
          className={`flex flex-col items-center transition-colors ${
            isActive("/shop")
              ? "text-orange-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag size={24} />
          <span className="text-xs">Shop</span>
        </Link>
        <button
          onClick={handleOnClickCartMenu}
          className={`flex flex-col items-center transition-colors ${
            cartMenuOpen
              ? "text-orange-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag size={24} />
          <span className="text-xs">Cart</span>
        </button>
        <button
          onClick={handleOnClickAccountMenu}
          className={`flex flex-col items-center transition-colors ${
            accountMenuOpen || isActive("/profile") || isActive("/account")
              ? "text-orange-500"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User size={24} />
          <span className="text-xs">Account</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomBar;
