"use client";
import React from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

const NavbarInput = ({ responsive }: { responsive: boolean }) => {
  const router = useRouter();

  const handleSearchClick = () => {
    router.push('/search');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const query = target.value.trim();
      if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      } else {
        router.push('/search');
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // If the input is empty, navigate to search page on focus
    if (!e.target.value.trim()) {
      router.push('/search');
    }
  };

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
          className="pl-10 pr-4 py-2 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-border cursor-pointer"
          onClick={handleSearchClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
      </div>
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
          className="pl-10 pr-4 py-2 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-border cursor-pointer"
          onClick={handleSearchClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

export default NavbarInput;
