"use client";
import { useAtom, useStore } from "jotai";
import React from "react";
import { hamburgerMenuState } from "../store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight, Menu, Package, Truck, User, Download } from "lucide-react";
import Link from "next/link";

const MobileHamBurgerMenu = ({
  navItems,
}: {
  navItems: { name: string; icon: any; hasSubmenu?: boolean }[];
}) => {
  const [hamMenuOpen, setHamMenuOpen] = useAtom(hamburgerMenuState, {
    store: useStore(),
  });
  const handleOnClickHamurgerMenu = () => {
    setHamMenuOpen(true);
  };

  const getNavItemHref = (itemName: string) => {
    if (itemName === "CATEGORY") return "/categories";
    return "#";
  };

  return (
    <Sheet open={hamMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2 hover:bg-orange-500/10 hover:text-orange-500 transition-colors"
          onClick={() => handleOnClickHamurgerMenu()}
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[320px] sm:w-[400px] overflow-y-auto p-0"
      >
        {/* Header Section */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <User size={32} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold">Welcome!</p>
              <p className="text-orange-100 text-sm">Download our app and get 10% OFF!</p>
            </div>
          </div>
          <Button 
            className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
            size="lg"
          >
            <Download size={20} className="mr-2" />
            Download App
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center space-y-2 h-20 border-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 group"
            >
              <Package size={24} className="text-muted-foreground group-hover:text-orange-500 transition-colors" />
              <span className="text-sm font-medium">My Orders</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center space-y-2 h-20 border-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 group"
            >
              <Truck size={24} className="text-muted-foreground group-hover:text-orange-500 transition-colors" />
              <span className="text-sm font-medium">Track Order</span>
            </Button>
          </div>

          {/* Navigation Items */}
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Categories
          </h3>
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <Link 
                key={item.name}
                href={getNavItemHref(item.name)}
                onClick={() => setHamMenuOpen(false)}
              >
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-orange-200 dark:hover:border-orange-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-muted group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                      {React.cloneElement(item.icon, { 
                        size: 20, 
                        className: "text-muted-foreground group-hover:text-orange-500 transition-colors" 
                      })}
                    </div>
                    <span className="font-medium text-foreground group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  {item.hasSubmenu && (
                    <ChevronRight 
                      size={20} 
                      className="text-muted-foreground group-hover:text-orange-500 transition-colors" 
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Promotional Banner */}
        <div className="mx-6 mb-6">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <p className="font-bold text-lg mb-1">🎉 NEW LAUNCH ALERT!</p>
              <p className="text-emerald-100 text-sm">Check out our latest collection</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileHamBurgerMenu;
