"use client";
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const NavbarInput = ({ responsive }: { responsive: boolean }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');

  // Sync with URL parameters
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && query !== searchValue) {
      setSearchValue(query);
    }
  }, [searchParams, searchValue]);

  // Check if we're on the search page
  const isOnSearchPage = pathname === '/search';

  const handleNavigateToSearch = () => {
    // Always navigate to search page when clicked
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigateToSearch();
    }
  };

  // This component is now only used for large screens
  // Mobile search is handled by a search icon in the bottom navigation
  if (responsive) {
    return null; // Don't render anything for mobile
  }

  // For large screens - render as premium styled icon button
  return (
    <div className="hidden lg:block">
      <Button
        variant="ghost"
        onClick={handleNavigateToSearch}
        onKeyDown={handleKeyPress}
        className={`
          flex items-center gap-3 px-5 py-3 h-12 rounded-xl
          border-2 transition-all duration-300 ease-out
          font-bold text-sm tracking-wide
          transform hover:scale-105 active:scale-95
          ${
            isOnSearchPage 
              ? `
                bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                border-blue-500 shadow-lg shadow-blue-500/25
                hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:shadow-blue-500/30
                dark:from-blue-500 dark:to-purple-500 dark:border-blue-400
                dark:shadow-blue-400/25 dark:hover:shadow-blue-400/30
              `
              : `
                bg-white/80 text-slate-700 border-slate-200/80
                hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300
                hover:shadow-md shadow-sm backdrop-blur-sm
                dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80
                dark:hover:bg-slate-700/80 dark:hover:text-blue-400 dark:hover:border-blue-500/50
                dark:shadow-slate-900/20 dark:hover:shadow-slate-900/30
              `
          }
        `}
        aria-label="Open search page"
      >
        <Search className={`w-4 h-4 ${
          isOnSearchPage 
            ? 'text-white drop-shadow-sm' 
            : 'text-slate-600 dark:text-slate-400'
        }`} />
        <span className="font-bold">Search</span>
      </Button>
    </div>
  );
};

export default NavbarInput;
