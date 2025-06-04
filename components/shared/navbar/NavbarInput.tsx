"use client";
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const NavbarInput = ({ responsive }: { responsive: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');

  // Sync with URL parameters
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && query !== searchValue) {
      setSearchValue(query);
    }
  }, [searchParams, searchValue]);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchValue);
    }
  };

  const handleFocus = () => {
    // Navigate to search page on focus if not already there
    if (window.location.pathname !== '/search') {
      const currentQuery = searchValue.trim();
      if (currentQuery) {
        router.push(`/search?q=${encodeURIComponent(currentQuery)}`);
      } else {
        router.push('/search');
      }
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
          value={searchValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          className="pl-10 pr-4 py-2 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-border cursor-pointer"
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
          value={searchValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          className="pl-10 pr-4 py-2 w-full border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-border cursor-pointer"
        />
      </div>
    </div>
  );
};

export default NavbarInput;
