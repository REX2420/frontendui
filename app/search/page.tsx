"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, Grid, List, SlidersHorizontal, X, Star, Eye, Heart, ShoppingBag, User, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import { handleError } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
interface SearchFilters {
  query: string;
  category: string;
  priceRange: [number, number];
  sortBy: string;
  inStock: boolean;
  featured: boolean;
  discount: boolean;
  page: number;
  limit: number;
}

interface SearchResults {
  products: any[];
  blogs: any[];
  vendors: any[];
  total: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

interface TrendingSubcategory {
  id: string;
  name: string;
  slug: string;
  parentCategory: string;
  productCount: number;
  image?: string;
}

const PRODUCT_CATEGORIES = [
  "All", "Perfume", "Skincare", "Bath & Body", "Gifting", "Combos"
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" }
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [trendingSubcategories, setTrendingSubcategories] = useState<TrendingSubcategory[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    products: [],
    blogs: [],
    vendors: [],
    total: 0,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalResults: 0,
      hasNext: false,
      hasPrev: false,
      limit: 10
    }
  });
  
  // Search History State
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<Array<{id: string, name: string, query: string, filters: SearchFilters, timestamp: Date}>>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") || "",
    category: "All",
    priceRange: [0, 1000],
    sortBy: "relevance",
    inStock: false,
    featured: false,
    discount: false,
    page: 1,
    limit: 10
  });

  // Search function
  const performSearch = useCallback(async () => {
    console.log('🔍 performSearch called with filters:', filters);
    setIsLoading(true);
    
    // Mark search start time for duration tracking
    const searchStartTime = Date.now();
    
    try {
      let products = [], blogs = [], vendors = [];

      // Enhanced product search with better error handling
      try {
        console.log('🔍 Searching products with filters:', filters);
        
        const productResponse = await fetch(`/api/search/products?${new URLSearchParams({
          q: filters.query || "", // Allow empty query for browse mode
          category: filters.category !== "All" ? filters.category : "",
          minPrice: filters.priceRange[0].toString(),
          maxPrice: filters.priceRange[1].toString(),
          sortBy: filters.sortBy,
          inStock: filters.inStock.toString(),
          featured: filters.featured.toString(),
          discount: filters.discount.toString(),
          page: filters.page.toString(),
          limit: filters.limit.toString()
        })}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Product API Response Status:', productResponse.status);
        
        if (productResponse.ok) {
          const productData = await productResponse.json();
          console.log('✅ Product API Response:', productData);
          
          products = productData.success ? productData.products : [];
          
          if (productData.success) {
            console.log(`🎯 Found ${products.length} products`);
          } else {
            console.warn('❌ Product API returned unsuccessful response:', productData.message);
          }
        } else {
          console.error('❌ Product API HTTP Error:', productResponse.status, productResponse.statusText);
          throw new Error(`HTTP ${productResponse.status}: ${productResponse.statusText}`);
        }
      } catch (error) {
        console.error('🚨 Product search API failed:', error);
        
        // Fallback to existing product search function
        try {
          console.log('🔄 Trying fallback product search...');
          const { getProductsByQuery } = await import("@/lib/database/actions/product.actions");
          const productResult = await getProductsByQuery(filters.query || "");
          products = productResult?.success ? productResult.products : [];
          console.log('✅ Fallback product search result:', products.length, 'products');
        } catch (fallbackError) {
          console.error("🚨 Fallback product search failed:", fallbackError);
          products = [];
        }
      }

      // Enhanced blog search
      try {
        console.log('📝 Searching blogs with query:', filters.query);
        const blogResponse = await fetch(`/api/search/blogs?q=${encodeURIComponent(filters.query)}&page=${filters.page}&limit=${Math.ceil(filters.limit / 3)}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          console.log('📝 Blog API Response:', blogData);
          // Handle different response structures from blog APIs
          if (blogData.success) {
            blogs = blogData.blogs || blogData.data || [];
            console.log(`📝 Found ${blogs.length} blogs`);
          } else {
            console.warn('❌ Blog API returned unsuccessful response:', blogData.message);
          }
        }
      } catch (error) {
        console.warn('🚨 Blog search failed:', error);
        
        // Fallback: search blogs using existing API
        try {
          const blogResponse = await fetch(`/api/blogs?search=${encodeURIComponent(filters.query)}&limit=10`);
          if (blogResponse.ok) {
            const blogData = await blogResponse.json();
            blogs = blogData.success ? blogData.blogs : [];
            console.log(`📝 Fallback blog search: ${blogs.length} blogs`);
          }
        } catch (fallbackError) {
          console.warn("Blog search fallback failed:", fallbackError);
          blogs = [];
        }
      }

      // Enhanced vendor search
      try {
        console.log('👥 Searching vendors with query:', filters.query);
        const vendorResponse = await fetch(`/api/search/vendors?q=${encodeURIComponent(filters.query)}&page=${filters.page}&limit=${Math.ceil(filters.limit / 3)}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (vendorResponse.ok) {
          const vendorData = await vendorResponse.json();
          console.log('👥 Vendor API Response:', vendorData);
          // Handle different response structures from vendor APIs
          if (vendorData.success) {
            vendors = vendorData.vendors || vendorData.data || [];
            console.log(`👥 Found ${vendors.length} vendors`);
          } else {
            console.warn('❌ Vendor API returned unsuccessful response:', vendorData.message);
          }
        }
      } catch (error) {
        console.warn("🚨 Vendor search failed:", error);
        vendors = [];
      }

      const totalResults = (products?.length || 0) + (blogs?.length || 0) + (vendors?.length || 0);
      const calculatedTotalPages = Math.max(1, Math.ceil(totalResults / filters.limit));

      console.log(`📊 Search Summary: ${totalResults} total results (${products.length} products, ${blogs.length} blogs, ${vendors.length} vendors)`);

      setSearchResults({
        products: Array.isArray(products) ? products : [],
        blogs: Array.isArray(blogs) ? blogs : [],
        vendors: Array.isArray(vendors) ? vendors : [],
        total: totalResults,
        pagination: {
          currentPage: filters.page,
          totalPages: calculatedTotalPages,
          totalResults,
          hasNext: filters.page < calculatedTotalPages,
          hasPrev: filters.page > 1,
          limit: filters.limit
        }
      });

      // Save search term to history after successful search
      if (filters.query.trim() && filters.query.length >= 2) {
        const searchTerm = filters.query.trim();
        setSearchHistory(prev => {
          const newHistory = [searchTerm, ...prev.filter(term => term !== searchTerm)].slice(0, 10);
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('vibecart_search_history', JSON.stringify(newHistory));
          }
          
          return newHistory;
        });

        // Track search analytics
        try {
          const searchEndTime = Date.now();
          const searchDuration = searchEndTime - searchStartTime;
          
          fetch('/api/search/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              searchTerm,
              resultCount: totalResults,
              searchDuration
            })
          }).catch(err => console.warn('Analytics tracking failed:', err));
        } catch (analyticsError) {
          console.warn('Search analytics failed:', analyticsError);
        }
      }

    } catch (error) {
      console.error('🚨 Search failed completely:', error);
      handleError(error);
      toast.error("Search failed. Please try again.");
      setSearchResults({ products: [], blogs: [], vendors: [], total: 0, pagination: { currentPage: 1, totalPages: 1, totalResults: 0, hasNext: false, hasPrev: false, limit: 10 } });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch trending subcategories
  const fetchTrendingSubcategories = useCallback(async () => {
    try {
      setTrendingLoading(true);
      const response = await fetch('/api/subcategories/popular?limit=8');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTrendingSubcategories(data.data);
        } else {
          console.warn("Failed to fetch trending subcategories:", data.message);
          // Fallback to empty array - no error shown to user
          setTrendingSubcategories([]);
        }
      } else {
        console.warn("Trending subcategories API not available");
        setTrendingSubcategories([]);
      }
    } catch (error) {
      console.warn("Error fetching trending subcategories:", error);
      // Fallback to empty array - no error shown to user
      setTrendingSubcategories([]);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  // URL parameter functions  
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category !== 'All') params.set('category', filters.category);
    if (filters.priceRange[0] !== 0) params.set('minPrice', filters.priceRange[0].toString());
    if (filters.priceRange[1] !== 1000) params.set('maxPrice', filters.priceRange[1].toString());
    if (filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.featured) params.set('featured', 'true');
    if (filters.discount) params.set('discount', 'true');
    if (filters.page !== 1) params.set('page', filters.page.toString());
    if (filters.limit !== 10) params.set('limit', filters.limit.toString());
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const loadFromUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const newFilters = {
      query: params.get('q') || '',
      category: params.get('category') || 'All',
      priceRange: [
        parseInt(params.get('minPrice') || '0'),
        parseInt(params.get('maxPrice') || '1000')
      ] as [number, number],
      sortBy: params.get('sortBy') || 'relevance',
      inStock: params.get('inStock') === 'true',
      featured: params.get('featured') === 'true',
      discount: params.get('discount') === 'true',
      page: parseInt(params.get('page') || '1'),
      limit: parseInt(params.get('limit') || '10')
    };
    
    setFilters(newFilters);
  }, []);

  // Effects
  
  // Load URL parameters on mount (must be first)
  useEffect(() => {
    const params = searchParams;
    const newFilters = {
      query: params.get('q') || '',
      category: params.get('category') || 'All',
      priceRange: [
        parseInt(params.get('minPrice') || '0'),
        parseInt(params.get('maxPrice') || '1000')
      ] as [number, number],
      sortBy: params.get('sortBy') || 'relevance',
      inStock: params.get('inStock') === 'true',
      featured: params.get('featured') === 'true',
      discount: params.get('discount') === 'true',
      page: parseInt(params.get('page') || '1'),
      limit: parseInt(params.get('limit') || '10')
    };
    
    setFilters(newFilters);
  }, [searchParams]);

  // Perform search when filters change
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [performSearch]); // Fixed: depend on performSearch instead of filters

  // Update URL when filters change (separate effect to avoid conflicts)
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]); // Fixed: depend on updateUrlParams function

  // Fetch trending subcategories on mount
  useEffect(() => {
    fetchTrendingSubcategories();
  }, [fetchTrendingSubcategories]);

  // Initial search trigger (load browse results on mount)
  useEffect(() => {
    console.log('🚀 Initial search trigger on page load');
    performSearch();
  }, []); // Run once on mount

  // Auto-focus search input when page loads and no query exists
  useEffect(() => {
    // Focus the search input after component mounts
    const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') as HTMLInputElement;
    if (searchInput && !filters.query.trim()) {
      // Small delay to ensure the page is fully rendered
      setTimeout(() => {
        searchInput.focus();
      }, 100);
    }
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('vibecart_search_history');
      const savedQueries = localStorage.getItem('vibecart_saved_searches');
      
      if (savedHistory) {
        try {
          setSearchHistory(JSON.parse(savedHistory));
        } catch (error) {
          console.warn('Failed to load search history:', error);
        }
      }
      
      if (savedQueries) {
        try {
          const parsed = JSON.parse(savedQueries);
          setSavedSearches(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })));
        } catch (error) {
          console.warn('Failed to load saved searches:', error);
        }
      }
    }
  }, []);

  // Save complete search query with filters
  const saveCompleteSearch = useCallback((name: string) => {
    const newSavedSearch = {
      id: Date.now().toString(),
      name,
      query: filters.query,
      filters: { ...filters },
      timestamp: new Date()
    };
    
    setSavedSearches(prev => {
      const newSaved = [newSavedSearch, ...prev].slice(0, 20); // Keep last 20 saved searches
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibecart_saved_searches', JSON.stringify(newSaved));
      }
      
      return newSaved;
    });
    
    toast.success(`Search "${name}" saved successfully!`);
  }, [filters]);

  // Load saved search
  const loadSavedSearch = useCallback((savedSearch: any) => {
    setFilters(savedSearch.filters);
    toast.success(`Loaded search "${savedSearch.name}"`);
  }, []);

  // Delete saved search
  const deleteSavedSearch = useCallback((searchId: string) => {
    setSavedSearches(prev => {
      const newSaved = prev.filter(search => search.id !== searchId);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibecart_saved_searches', JSON.stringify(newSaved));
      }
      
      return newSaved;
    });
    
    toast.success('Saved search deleted');
  }, []);

  // Handle functions
  const handleClearSearch = () => {
    setFilters({
      query: '',
      category: 'All',
      priceRange: [0, 1000],
      sortBy: 'relevance',
      inStock: false,
      featured: false,
      discount: false,
      page: 1,
      limit: 10
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    // Smooth scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 })); // Reset to page 1 when changing limit
  };

  // Components
  const ProductCard = ({ product, viewMode = "grid" }: { product: any; viewMode?: "grid" | "list" }) => {
    if (viewMode === "list") {
      return (
        <Link href={`/product/${product.slug}?style=0`}>
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl dark:hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-1 bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-slate-200/50 dark:border-gray-800/50">
            <div className="flex flex-col sm:flex-row">
              {/* Image Section */}
              <div className="relative w-full sm:w-32 md:w-36 lg:w-40 aspect-square sm:aspect-auto sm:h-32 md:h-36 lg:h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 flex-shrink-0">
                <Image
                  src={product.subProducts?.[0]?.images?.[0]?.url || "/placeholder.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.subProducts?.[0]?.discount > 0 && (
                  <Badge className="absolute top-1 left-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs px-1 py-0.5 shadow-lg border-0">
                    -{product.subProducts[0].discount}%
                  </Badge>
                )}
                {product.featured && (
                  <Badge className="absolute top-1 right-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-xs px-1 py-0.5 shadow-lg border-0">
                    <Star className="w-2 h-2 mr-0.5" />
                    <span className="text-xs">★</span>
                  </Badge>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300" />
              </div>

              {/* Content Section */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 text-slate-900 dark:text-white">{product.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {product.description || "Premium quality product"}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm sm:text-lg bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                      MVR {product.subProducts?.[0]?.sizes?.[0]?.price || 0}
                    </span>
                    {product.subProducts?.[0]?.discount > 0 && (
                      <span className="text-xs text-slate-500 dark:text-gray-500 line-through">
                        MVR {Math.round(product.subProducts[0].sizes[0].price / (1 - product.subProducts[0].discount / 100))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-yellow-400" />
                      <span className="text-slate-700 dark:text-gray-300">{product.rating || 0}</span>
                      <span className="text-slate-500 dark:text-gray-400 hidden sm:inline">({product.numReviews || 0})</span>
                    </div>
                    <span className="text-slate-600 dark:text-gray-400 truncate max-w-16">
                      {product.brand || "VibeCart"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-gray-800">
                  <div className="flex items-center gap-1 text-xs">
                    {product.subProducts?.[0]?.sizes?.[0]?.qty > 0 ? (
                      <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-300 text-xs px-1 py-0 border-0">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-800 dark:text-red-300 text-xs px-1 py-0 border-0">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-600 dark:group-hover:from-cyan-400 dark:group-hover:to-purple-500 group-hover:text-white group-hover:border-transparent transition-all duration-300 text-xs px-2 py-1 h-auto border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300">
                    <ShoppingBag className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      );
    }

    // Grid view (original)
    return (
      <Link href={`/product/${product.slug}?style=0`}>
        <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl dark:hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-1 bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-slate-200/50 dark:border-gray-800/50">
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800">
            <Image
              src={product.subProducts?.[0]?.images?.[0]?.url || "/placeholder.jpg"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.subProducts?.[0]?.discount > 0 && (
              <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-xs px-1 sm:px-2 py-0.5 shadow-lg border-0">
                -{product.subProducts[0].discount}%
              </Badge>
            )}
            {product.featured && (
              <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white text-xs px-1 sm:px-2 py-0.5 shadow-lg border-0">
                <Star className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Featured</span>
                <span className="sm:hidden">★</span>
              </Badge>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300" />
          </div>
          <CardContent className="p-2 sm:p-3">
            <h3 className="font-semibold text-xs sm:text-sm truncate mb-1 text-slate-900 dark:text-white">{product.name}</h3>
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="font-bold text-sm sm:text-lg bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                MVR {product.subProducts?.[0]?.sizes?.[0]?.price || 0}
              </span>
              {product.subProducts?.[0]?.discount > 0 && (
                <span className="text-xs sm:text-sm text-slate-500 dark:text-gray-500 line-through">
                  MVR {Math.round(product.subProducts[0].sizes[0].price / (1 - product.subProducts[0].discount / 100))}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-yellow-400" />
                <span className="text-xs text-slate-700 dark:text-gray-300">{product.rating || 0}</span>
                <span className="text-xs hidden sm:inline">({product.numReviews || 0})</span>
              </div>
              <span className="text-xs truncate max-w-16 sm:max-w-none text-slate-600 dark:text-gray-400">{product.brand || "VibeCart"}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const BlogCard = ({ blog, viewMode = "grid" }: { blog: any; viewMode?: "grid" | "list" }) => {
    if (viewMode === "list") {
      return (
        <Link href={`/blog/${blog.slug}`}>
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex flex-col sm:flex-row">
              {/* Image Section */}
              <div className="relative w-full sm:w-32 md:w-36 lg:w-40 aspect-[16/10] sm:aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex-shrink-0">
                <Image
                  src={blog.featuredImage?.url || "/placeholder.jpg"}
                  alt={blog.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <Badge className="absolute top-1 left-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-xs px-1 py-0.5 shadow-lg border-0">
                  {blog.category}
                </Badge>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-3">
                    {blog.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{blog.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{blog.likes || 0}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-20">
                    <span className="font-medium">{blog.authorName}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      );
    }

    // Grid view (original)
    return (
      <Link href={`/blog/${blog.slug}`}>
        <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50">
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
            <Image
              src={blog.featuredImage?.url || "/placeholder.jpg"}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
              <Badge className="mb-1 sm:mb-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-xs px-1.5 sm:px-2 py-0.5 shadow-lg border-0">
                {blog.category}
              </Badge>
              <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2">
                {blog.title}
              </h3>
            </div>
          </div>
          <CardContent className="p-2 sm:p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-1 sm:mb-2">
              {blog.excerpt}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{blog.views || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{blog.likes || 0}</span>
                </div>
              </div>
              <span className="truncate max-w-16 sm:max-w-none">{blog.authorName}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const VendorCard = ({ vendor, viewMode = "grid" }: { vendor: any; viewMode?: "grid" | "list" }) => {
    if (viewMode === "list") {
      return (
        <Link href={`/vendor/${vendor._id}`}>
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center p-3 sm:p-4">
              {/* Avatar */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm sm:text-lg font-bold mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                {vendor.name.charAt(0).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base mb-1 truncate bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{vendor.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                  {vendor.description || "Professional vendor"}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Vendor</span>
                  </div>
                  {vendor.productsCount && (
                    <>
                      <span>•</span>
                      <span>{vendor.productsCount} items</span>
                    </>
                  )}
                  {vendor.rating && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-yellow-400" />
                        <span>{vendor.rating}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      );
    }

    // Grid view (original)
    return (
      <Link href={`/vendor/${vendor._id}`}>
        <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-full mx-auto mb-2 sm:mb-3 flex items-center justify-center text-white text-base sm:text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
              {vendor.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-semibold text-xs sm:text-sm mb-1 truncate bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">{vendor.name}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 sm:mb-2 line-clamp-2">
              {vendor.description || "Professional vendor"}
            </p>
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs text-slate-500 dark:text-slate-400">
              <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Vendor</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const FilterSheet = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:border-blue-300 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300">
          <SlidersHorizontal className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-700">
        <SheetHeader>
          <SheetTitle className="text-base sm:text-lg bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Search Filters</SheetTitle>
        </SheetHeader>
        <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Category Filter */}
          <div className="p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-blue-100 dark:border-slate-600">
            <label className="text-sm font-medium mb-2 block text-slate-700 dark:text-slate-300">Category</label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="h-10 sm:h-11 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-purple-500/30 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl">
                {PRODUCT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category} className="text-sm focus:bg-gradient-to-r focus:from-blue-50 focus:to-purple-50 dark:focus:from-slate-700 dark:focus:to-slate-600 rounded-lg">{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-purple-100 dark:border-slate-600">
            <label className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-300">
              Price Range: MVR {filters.priceRange[0]} - MVR {filters.priceRange[1]}
            </label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                max={1000}
                min={0}
                step={10}
                className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-blue-500 [&_[role=slider]]:to-purple-600 [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-lg"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>MVR 0</span>
              <span>MVR 1000</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl border border-green-100 dark:border-slate-600">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Filters</label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                  className="rounded w-4 h-4 text-blue-600 focus:ring-blue-500/30 dark:focus:ring-purple-500/30 border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">In Stock Only</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded w-4 h-4 text-purple-600 focus:ring-purple-500/30 border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm flex-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">Featured Products</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-sm transition-all duration-200 group">
                <input
                  type="checkbox"
                  checked={filters.discount}
                  onChange={(e) => setFilters(prev => ({ ...prev, discount: e.target.checked }))}
                  className="rounded w-4 h-4 text-pink-600 focus:ring-pink-500/30 border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm flex-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-200">On Sale</span>
              </label>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="outline" 
              className="w-full bg-gradient-to-r from-red-50 to-orange-50 dark:from-slate-800 dark:to-slate-700 border-red-200 dark:border-slate-600 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/20 dark:hover:to-orange-900/20 hover:border-red-300 dark:hover:border-red-500 text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-all duration-300"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                category: "All", 
                priceRange: [0, 1000], 
                inStock: false, 
                featured: false, 
                discount: false,
                page: 1,
                limit: 10
              }))}
            >
              Clear All Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const PaginationComponent = () => {
    const { currentPage, totalPages, hasNext, hasPrev } = searchResults.pagination;
    
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing page {currentPage} of {totalPages} ({searchResults.pagination.totalResults} total results)
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrev}
            className="text-xs sm:text-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          {/* Page numbers */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8 p-0 text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            className="text-xs sm:text-sm"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {/* Results per page selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Show:</span>
          <select
            value={filters.limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-gray-600 dark:text-gray-400">per page</span>
        </div>
      </div>
    );
  };

  // Loading Components
  const SearchResultsSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="p-3 sm:p-4 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-8">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Icon container */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center shadow-xl border border-slate-200/50 dark:border-slate-600/50">
          <Search className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 dark:text-slate-300" />
        </div>
      </div>
      
      {filters.query.trim() ? (
        // No results found for search query
        <>
          <div className="max-w-lg mx-auto space-y-6">
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                No results found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl leading-relaxed">
                We couldn't find anything matching <span className="font-semibold text-slate-800 dark:text-slate-200">"{filters.query}"</span>
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm sm:text-base">
                Try adjusting your search terms or explore our popular categories below.
              </p>
            </div>
            
            

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                onClick={() => setFilters(prev => ({ ...prev, query: "", page: 1 }))}
                className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 dark:hover:shadow-purple-500/25 hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                Browse All Products
              </button>
              <button
                onClick={handleClearSearch}
                className="px-6 py-3 sm:px-8 sm:py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 text-sm sm:text-base"
              >
                Clear Search
              </button>
            </div>
          </div>
        </>
      ) : (
        // Welcome state for empty search
        <>
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Discover Amazing Products
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl leading-relaxed">
                Search through our curated collection of perfumes, skincare, and beauty products.
              </p>
            </div>
            
            {/* Enhanced search input */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-focus-within:blur-2xl transition-all duration-300"></div>
                <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-xl">
                  <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
                  <input
                    type="text"
                    placeholder="Try searching for 'perfume' or 'skincare'..."
                    value={filters.query}
                    onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value, page: 1 }))}
                    className="w-full pl-12 sm:pl-16 pr-6 py-4 sm:py-6 text-base sm:text-lg border-0 bg-transparent focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-purple-400/50 transition-all duration-300 rounded-2xl placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white font-medium"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Category suggestions */}
            <div className="space-y-6">
              <h4 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">
                Popular categories:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {[
                  { name: "Perfume", icon: "🌹" },
                  { name: "Skincare", icon: "✨" },
                  { name: "Bath & Body", icon: "🛁" },
                  { name: "Gifting", icon: "🎁" },
                  { name: "Combos", icon: "💝" }
                ].map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setFilters(prev => ({ ...prev, query: category.name, page: 1 }))}
                    className="group p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-purple-500 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-purple-500/10 hover:scale-105 active:scale-95"
                  >
                    <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                      {category.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const SearchResultsGrid = ({ results, activeTab, viewMode }: {
    results: SearchResults;
    activeTab: string;
    viewMode: 'grid' | 'list';
  }) => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6 sm:mb-8 h-auto bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-slate-200/50 dark:border-gray-800/50 rounded-2xl shadow-lg dark:shadow-purple-500/10 p-1">
        <TabsTrigger value="all" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-cyan-400 dark:data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-slate-100 dark:hover:bg-gray-800/50 text-slate-700 dark:text-gray-300">
          <Search className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">All</span>
          <span className="text-xs opacity-75">({results.total})</span>
        </TabsTrigger>
        <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-cyan-400 dark:data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-slate-100 dark:hover:bg-gray-800/50 text-slate-700 dark:text-gray-300">
          <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Products</span>
          <span className="text-xs opacity-75">({results.products.length})</span>
        </TabsTrigger>
        <TabsTrigger value="blogs" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-cyan-400 dark:data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-slate-100 dark:hover:bg-gray-800/50 text-slate-700 dark:text-gray-300">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Blogs</span>
          <span className="text-xs opacity-75">({results.blogs.length})</span>
        </TabsTrigger>
        <TabsTrigger value="vendors" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 dark:data-[state=active]:from-cyan-400 dark:data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:bg-slate-100 dark:hover:bg-gray-800/50 text-slate-700 dark:text-gray-300">
          <User className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-medium">Vendors</span>
          <span className="text-xs opacity-75">({results.vendors.length})</span>
        </TabsTrigger>
      </TabsList>

      {/* All Results */}
      <TabsContent value="all">
        <div className="space-y-6 sm:space-y-8">
          {results.products.length > 0 && (
            <section>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                Products ({results.products.length})
              </h3>
              <div className={`grid gap-3 sm:gap-4 ${
                viewMode === "grid" 
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
                  : "grid-cols-1 lg:grid-cols-2"
              }`}>
                {results.products.slice(0, 10).map((product, index) => (
                  <ProductCard key={index} product={product} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}

          {results.blogs.length > 0 && (
            <section>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                Blogs ({results.blogs.length})
              </h3>
              <div className={`grid gap-3 sm:gap-4 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1 lg:grid-cols-2"
              }`}>
                {results.blogs.slice(0, 6).map((blog, index) => (
                  <BlogCard key={index} blog={blog} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}

          {results.vendors.length > 0 && (
            <section>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                Vendors ({results.vendors.length})
              </h3>
              <div className={`grid gap-3 sm:gap-4 ${
                viewMode === "grid" 
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" 
                  : "grid-cols-1 sm:grid-cols-2"
              }`}>
                {results.vendors.slice(0, 6).map((vendor, index) => (
                  <VendorCard key={index} vendor={vendor} viewMode={viewMode} />
                ))}
              </div>
            </section>
          )}
        </div>
      </TabsContent>

      {/* Products Only */}
      <TabsContent value="products">
        <div className={`grid gap-3 sm:gap-4 ${
          viewMode === "grid" 
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" 
            : "grid-cols-1 lg:grid-cols-2"
        }`}>
          {results.products.map((product, index) => (
            <ProductCard key={index} product={product} viewMode={viewMode} />
          ))}
        </div>
      </TabsContent>

      {/* Blogs Only */}
      <TabsContent value="blogs">
        <div className={`grid gap-4 sm:gap-6 ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1 lg:grid-cols-2"
        }`}>
          {results.blogs.map((blog, index) => (
            <BlogCard key={index} blog={blog} viewMode={viewMode} />
          ))}
        </div>
      </TabsContent>

      {/* Vendors Only */}
      <TabsContent value="vendors">
        <div className={`grid gap-3 sm:gap-4 ${
          viewMode === "grid" 
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" 
            : "grid-cols-1 sm:grid-cols-2"
        }`}>
          {results.vendors.map((vendor, index) => (
            <VendorCard key={index} vendor={vendor} viewMode={viewMode} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-screen relative bg-white dark:bg-black">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Light theme gradients - deeper colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/60 via-purple-100/40 to-emerald-100/50 dark:opacity-0 transition-opacity duration-500"></div>
        
        {/* Dark theme neon gradients - positioned in middle and bottom areas */}
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/25 via-blue-600/15 to-transparent dark:opacity-100 opacity-0 transition-opacity duration-500 blur-3xl"></div>
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-600/25 via-violet-700/15 to-transparent dark:opacity-100 opacity-0 transition-opacity duration-500 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[400px] bg-gradient-to-tr from-emerald-500/20 via-green-600/12 to-transparent dark:opacity-100 opacity-0 transition-opacity duration-500 blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-tl from-blue-600/20 via-indigo-700/12 to-transparent dark:opacity-100 opacity-0 transition-opacity duration-500 blur-3xl"></div>
        
        {/* Center gradient for depth - positioned in middle area */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-[700px] h-[300px] bg-gradient-to-r from-purple-600/12 via-blue-600/8 to-emerald-500/12 dark:opacity-100 opacity-0 transition-opacity duration-500 blur-3xl"></div>
        
        {/* Additional subtle gradients for lower section */}
        <div className="absolute bottom-1/3 left-0 w-[400px] h-[300px] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent dark:opacity-100 opacity-0 transition-opacity duration-500 blur-3xl"></div>
        <div className="absolute bottom-1/2 right-0 w-[400px] h-[300px] bg-gradient-to-l from-pink-500/15 via-purple-500/10 to-transparent dark:opacity-100 opacity-0 transition-opacity duration-500 blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Search
            </h1>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-full sm:max-w-2xl mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-slate-200/50 dark:border-gray-800/50 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-cyan-500/5">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                type="text"
                placeholder="Search products, blogs, vendors..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value, page: 1 }))}
                onFocus={() => setShowSearchHistory(true)}
                onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                className="pl-10 sm:pl-12 pr-10 h-12 sm:h-14 text-base border-0 bg-transparent focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-cyan-400/50 transition-all duration-300 rounded-2xl placeholder:text-slate-400 dark:placeholder:text-gray-400 text-slate-900 dark:text-white"
                autoFocus
              />
              {filters.query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 hover:bg-slate-100 dark:hover:bg-gray-800/50 rounded-full p-1.5 transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-slate-400 dark:text-gray-400" />
                </Button>
              )}
            </div>

            {/* Search History Dropdown */}
            {showSearchHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-black/90 backdrop-blur-xl border border-slate-200/50 dark:border-gray-800/50 rounded-2xl shadow-2xl dark:shadow-cyan-500/10 z-50 max-h-60 overflow-y-auto mt-2">
                <div className="p-2">
                  <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-2 px-2">Recent Searches</div>
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setFilters(prev => ({ ...prev, query: term, page: 1 }));
                        setShowSearchHistory(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/50 rounded-xl text-sm flex items-center gap-2 transition-all duration-200 text-slate-900 dark:text-gray-200"
                    >
                      <Search className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                      <span className="flex-1">{term}</span>
                    </button>
                  ))}
                  <div className="border-t border-slate-200 dark:border-gray-800 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setSearchHistory([]);
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('vibecart_search_history');
                        }
                        setShowSearchHistory(false);
                      }}
                      className="w-full text-left px-3 py-1 hover:bg-slate-100 dark:hover:bg-gray-800/50 rounded-xl text-xs text-slate-500 dark:text-gray-400 transition-colors duration-200"
                    >
                      Clear history
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Current Search */}
          {filters.query.trim() && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const searchName = prompt("Enter a name for this search:");
                  if (searchName?.trim()) {
                    saveCompleteSearch(searchName.trim());
                  }
                }}
                className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border-blue-200 dark:border-slate-600 hover:from-blue-100 hover:to-purple-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300"
              >
                Save Search
              </Button>
              
              {savedSearches.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const saved = savedSearches.find(s => s.id === e.target.value);
                      if (saved) loadSavedSearch(saved);
                    }
                  }}
                  className="px-2 py-1 border rounded-xl text-xs bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-purple-500/30 transition-all duration-300"
                >
                  <option value="">Load Saved Search</option>
                  {savedSearches.map((saved) => (
                    <option key={saved.id} value={saved.id}>
                      {saved.name} ({saved.query || 'browse'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Trending Searches */}
          {!filters.query && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-slate-600 dark:text-slate-400">
                Trending Categories
                {!trendingLoading && trendingSubcategories.length > 0 && (
                  <span className="ml-2 text-xs text-slate-500">({trendingSubcategories.length} popular)</span>
                )}
              </h3>
              
              {trendingLoading ? (
                <div className="flex gap-2">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="h-8 w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {trendingSubcategories.length > 0 ? (
                    trendingSubcategories.map((trend) => (
                      <Button
                        key={trend.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, query: trend.name }))}
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 h-auto bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 border-slate-200 dark:border-slate-600 hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 hover:border-blue-300 dark:hover:border-purple-500 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                        title={`${trend.productCount} products in ${trend.parentCategory}`}
                      >
                        <span className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400">
                          {trend.name}
                        </span>
                        <span className="ml-1 text-xs opacity-70 group-hover:opacity-100 text-slate-500 dark:text-slate-400">
                          ({trend.productCount})
                        </span>
                      </Button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No trending categories available</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Results */}
        {filters.query && (
          <>
            {/* Loading State */}
            {isLoading && <SearchResultsSkeleton />}

            {/* Results Header */}
            {!isLoading && searchResults.total > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-4 sm:p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    {searchResults.total} results for "{filters.query}"
                  </h2>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-800 dark:text-blue-200 border-0">
                    Page {searchResults.pagination.currentPage}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <FilterSheet />
                  
                  <Select value={filters.sortBy} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, sortBy: value, page: 1 }))
                  }>
                    <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-purple-500/30 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl">
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm focus:bg-gradient-to-r focus:from-blue-50 focus:to-purple-50 dark:focus:from-slate-700 dark:focus:to-slate-600 rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`rounded-none px-2 sm:px-3 ${
                        viewMode === 'grid' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                          : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600'
                      } transition-all duration-300`}
                    >
                      <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`rounded-none px-2 sm:px-3 ${
                        viewMode === 'list' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                          : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:to-slate-600'
                      } transition-all duration-300`}
                    >
                      <List className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!isLoading && searchResults.total > 0 && (
              <SearchResultsGrid 
                results={searchResults} 
                activeTab={activeTab}
                viewMode={viewMode}
              />
            )}

            {/* No Results */}
            {!isLoading && searchResults.total === 0 && filters.query && (
              <EmptyState />
            )}

            <PaginationComponent />
          </>
        )}

        {/* Welcome State - No Search Query */}
        {!filters.query && (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
              <div className="relative p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto flex items-center justify-center shadow-2xl">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">Start your search</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
              Search for products, blogs, and vendors. Use the search bar above or try one of the trending categories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 