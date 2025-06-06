"use client";
import { LuStore } from "react-icons/lu";
import { GrLike } from "react-icons/gr";
import Link from "next/link";
import CartDrawer from "./CartDrawer";
import MobileHamBurgerMenu from "./mobile/hamburgerMenu";
import NavbarInput from "./NavbarInput";
import AccountDropDown from "@/components/shared/navbar/AccountDropDown";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import CategoryDropdown from "./CategoryDropdown";

const Navbar = () => {
  const navItems = [
    { name: "CATEGORY", icon: <LuStore size={24} /> },
    { name: "BLOGS", icon: <GrLike size={24} /> },
  ];

  return (
    <nav className="w-full bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 ">
          <div className="flex items-center lg:w-1/3">
            {/* mobile hamburger menu */}
            <MobileHamBurgerMenu navItems={navItems} />

            {/* Search for large screens only */}
            <NavbarInput responsive={false} />
          </div>

          <div className="flex-1 flex items-center justify-center lg:w-1/3">
            <Link href={"/"}>
              {" "}
              <h1 className="text-2xl font-bold">IULAANSHOP</h1>
            </Link>
          </div>

          <div className="flex items-center justify-end lg:w-1/3 gap-2">
            <ThemeToggle />
            <div className="">
              {" "}
              <AccountDropDown />
            </div>
            <CartDrawer />
          </div>
        </div>
      </div>

      <div className="hidden lg:block border-t border-border mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-evenly py-3">
            <CategoryDropdown />
            <Link
              href="/blog"
              className="text-sm font-medium text-foreground hover:text-primary group transition duration-300"
            >
              BLOGS
              <span className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-foreground"></span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
