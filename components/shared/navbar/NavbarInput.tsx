"use client";
import React, { useState } from "react";
import SearchModal from "./SearchModal";
import { Search } from "lucide-react";

const NavbarInput = ({ responsive }: { responsive: boolean }) => {
  const [open, setOpen] = useState<boolean>(false);
  return responsive ? (
    <div className="lg:hidden">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="search"
          placeholder="Search for products, brands and more..."
          className="pl-10 pr-4 py-2 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-border"
          onClick={() => setOpen(true)}
        />
      </div>
      {open && <SearchModal setOpen={setOpen} />}
    </div>
  ) : (
    <div className="hidden lg:block w-full max-w-xs">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="search"
          placeholder="Search for products, brands and more..."
          className="pl-10 pr-4 py-2 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-border"
          onClick={() => setOpen(true)}
        />
        {open && <SearchModal setOpen={setOpen} />}
      </div>
    </div>
  );
};

export default NavbarInput;
