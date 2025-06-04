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
    if (!filters.query.trim()) {
      setSearchResults({ products: [], blogs: [], vendors: [], total: 0, pagination: { currentPage: 1, totalPages: 1, totalResults: 0, hasNext: false, hasPrev: false, limit: 10 } });
      return;
    }

    setIsLoading(true);
    try {
      let products = [], blogs = [], vendors = [];

      // Search products - try new API first, fallback to existing function
      try {
        const productResponse = await fetch(`/api/search/products?${new URLSearchParams({
          q: filters.query,
          category: filters.category !== "All" ? filters.category : "",
          minPrice: filters.priceRange[0].toString(),
          maxPrice: filters.priceRange[1].toString(),
          sortBy: filters.sortBy,
          inStock: filters.inStock.toString(),
          featured: filters.featured.toString(),
          discount: filters.discount.toString(),
          page: filters.page.toString(),
          limit: filters.limit.toString()
        })}`);
        
        if (productResponse.ok) {
          const productData = await productResponse.json();
          products = productData.success ? productData.products : [];
        }
      } catch (error) {
        // Fallback to existing product search function
        try {
          const { getProductsByQuery } = await import("@/lib/database/actions/product.actions");
          const productResult = await getProductsByQuery(filters.query);
          products = productResult?.success ? productResult.products : [];
        } catch (fallbackError) {
          console.warn("Product search failed:", fallbackError);
          products = [];
        }
      }

      // Search blogs
      try {
        const blogResponse = await fetch(`/api/search/blogs?q=${encodeURIComponent(filters.query)}&page=${filters.page}&limit=${Math.ceil(filters.limit / 3)}`);
        if (blogResponse.ok) {
          const blogData = await blogResponse.json();
          blogs = blogData.success ? blogData.blogs || blogData.data || [] : [];
        }
      } catch (error) {
        // Fallback: search blogs using existing API
        try {
          const blogResponse = await fetch(`/api/blogs?search=${encodeURIComponent(filters.query)}&limit=10`);
          if (blogResponse.ok) {
            const blogData = await blogResponse.json();
            blogs = blogData.success ? blogData.blogs : [];
          }
        } catch (fallbackError) {
          console.warn("Blog search failed:", fallbackError);
          blogs = [];
        }
      }

      // Search vendors
      try {
        const vendorResponse = await fetch(`/api/search/vendors?q=${encodeURIComponent(filters.query)}&page=${filters.page}&limit=${Math.ceil(filters.limit / 3)}`);
        if (vendorResponse.ok) {
          const vendorData = await vendorResponse.json();
          vendors = vendorData.success ? vendorData.vendors || vendorData.data || [] : [];
        }
      } catch (error) {
        console.warn("Vendor search not available yet:", error);
        vendors = [];
      }

      const totalResults = (products?.length || 0) + (blogs?.length || 0) + (vendors?.length || 0);
      const calculatedTotalPages = Math.max(1, Math.ceil(totalResults / filters.limit));

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
      
    } catch (error) {
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
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch();
      updateUrlParams();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [performSearch, updateUrlParams]);

  // Fetch trending subcategories on mount
  useEffect(() => {
    fetchTrendingSubcategories();
  }, [fetchTrendingSubcategories]);

  // Auto-focus search input when page loads
  useEffect(() => {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput && !filters.query) {
      searchInput.focus();
    }
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
  const ProductCard = ({ product }: { product: any }) => (
    <Link href={`/product/${product.slug}?style=0`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.subProducts?.[0]?.images?.[0]?.url || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.subProducts?.[0]?.discount > 0 && (
            <Badge className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-500 hover:bg-red-500 text-xs px-1 sm:px-2 py-0.5">
              -{product.subProducts[0].discount}%
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-yellow-500 hover:bg-yellow-500 text-xs px-1 sm:px-2 py-0.5">
              <Star className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Featured</span>
              <span className="sm:hidden">★</span>
            </Badge>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
        <CardContent className="p-2 sm:p-3">
          <h3 className="font-semibold text-xs sm:text-sm truncate mb-1">{product.name}</h3>
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <span className="font-bold text-sm sm:text-lg">
              MVR {product.subProducts?.[0]?.sizes?.[0]?.price || 0}
            </span>
            {product.subProducts?.[0]?.discount > 0 && (
              <span className="text-xs sm:text-sm text-gray-500 line-through">
                MVR {Math.round(product.subProducts[0].sizes[0].price / (1 - product.subProducts[0].discount / 100))}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current text-yellow-400" />
              <span className="text-xs">{product.rating || 0}</span>
              <span className="text-xs hidden sm:inline">({product.numReviews || 0})</span>
            </div>
            <span className="text-xs truncate max-w-16 sm:max-w-none">{product.brand || "VibeCart"}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const BlogCard = ({ blog }: { blog: any }) => (
    <Link href={`/blog/${blog.slug}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <Image
            src={blog.featuredImage?.url || "/placeholder.jpg"}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
            <Badge className="mb-1 sm:mb-2 bg-purple-500 hover:bg-purple-500 text-xs px-1.5 sm:px-2 py-0.5">
              {blog.category}
            </Badge>
            <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-2">
              {blog.title}
            </h3>
          </div>
        </div>
        <CardContent className="p-2 sm:p-3">
          <p className="text-xs text-gray-600 line-clamp-2 mb-1 sm:mb-2">
            {blog.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
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

  const VendorCard = ({ vendor }: { vendor: any }) => (
    <Link href={`/vendor/${vendor._id}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-3 sm:p-4 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-2 sm:mb-3 flex items-center justify-center text-white text-base sm:text-xl font-bold">
            {vendor.name.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-semibold text-xs sm:text-sm mb-1 truncate">{vendor.name}</h3>
          <p className="text-xs text-gray-600 mb-1 sm:mb-2 line-clamp-2">
            {vendor.description || "Professional vendor"}
          </p>
          <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs text-gray-500">
            <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>Vendor</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const FilterSheet = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
          <SlidersHorizontal className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-80">
        <SheetHeader>
          <SheetTitle className="text-base sm:text-lg">Search Filters</SheetTitle>
        </SheetHeader>
        <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category} className="text-sm">{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Price Range: MVR {filters.priceRange[0]} - MVR {filters.priceRange[1]}
            </label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>MVR 0</span>
              <span>MVR 1000</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Quick Filters</label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => setFilters(prev => ({ ...prev, inStock: e.target.checked }))}
                  className="rounded w-4 h-4"
                />
                <span className="text-sm flex-1">In Stock Only</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded w-4 h-4"
                />
                <span className="text-sm flex-1">Featured Products</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="checkbox"
                  checked={filters.discount}
                  onChange={(e) => setFilters(prev => ({ ...prev, discount: e.target.checked }))}
                  className="rounded w-4 h-4"
                />
                <span className="text-sm flex-1">On Sale</span>
              </label>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
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
    <div className="text-center py-12 sm:py-16">
      <Search className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-4 sm:mb-6" />
      <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">No results found</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
        Try adjusting your search terms or filters to find what you're looking for.
      </p>
      <Button onClick={handleClearSearch} variant="outline">
        Clear all filters
      </Button>
    </div>
  );

  const SearchResultsGrid = ({ results, activeTab, viewMode }: {
    results: SearchResults;
    activeTab: string;
    viewMode: 'grid' | 'list';
  }) => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6 sm:mb-8 h-auto">
        <TabsTrigger value="all" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
          <Search className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">All</span>
          <span className="text-xs text-gray-500">({results.total})</span>
        </TabsTrigger>
        <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
          <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Products</span>
          <span className="text-xs text-gray-500">({results.products.length})</span>
        </TabsTrigger>
        <TabsTrigger value="blogs" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Blogs</span>
          <span className="text-xs text-gray-500">({results.blogs.length})</span>
        </TabsTrigger>
        <TabsTrigger value="vendors" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
          <User className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Vendors</span>
          <span className="text-xs text-gray-500">({results.vendors.length})</span>
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
                  : "grid-cols-1"
              }`}>
                {results.products.slice(0, 10).map((product, index) => (
                  <ProductCard key={index} product={product} />
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
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {results.blogs.slice(0, 6).map((blog, index) => (
                  <BlogCard key={index} blog={blog} />
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
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {results.vendors.slice(0, 6).map((vendor, index) => (
                  <VendorCard key={index} vendor={vendor} />
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
            : "grid-cols-1"
        }`}>
          {results.products.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </TabsContent>

      {/* Blogs Only */}
      <TabsContent value="blogs">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {results.blogs.map((blog, index) => (
            <BlogCard key={index} blog={blog} />
          ))}
        </div>
      </TabsContent>

      {/* Vendors Only */}
      <TabsContent value="vendors">
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {results.vendors.map((vendor, index) => (
            <VendorCard key={index} vendor={vendor} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Search</h1>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-full sm:max-w-2xl mb-4 sm:mb-6">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="search"
              placeholder="Search products, blogs, vendors..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value, page: 1 }))}
              className="pl-10 sm:pl-12 pr-10 h-12 sm:h-14 text-base border-2 border-gray-200 dark:border-gray-700 focus:border-primary transition-colors"
              autoFocus
            />
            {filters.query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1.5"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Trending Searches */}
          {!filters.query && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-gray-600 dark:text-gray-400">
                Trending Categories
                {!trendingLoading && trendingSubcategories.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">({trendingSubcategories.length} popular)</span>
                )}
              </h3>
              
              {trendingLoading ? (
                <div className="flex gap-2">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
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
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 h-auto hover:bg-primary hover:text-primary-foreground transition-colors group"
                        title={`${trend.productCount} products in ${trend.parentCategory}`}
                      >
                        <span>{trend.name}</span>
                        <span className="ml-1 text-xs opacity-70 group-hover:opacity-100">
                          ({trend.productCount})
                        </span>
                      </Button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic">No trending categories available</p>
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    {searchResults.total} results for "{filters.query}"
                  </h2>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    Page {searchResults.pagination.currentPage}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <FilterSheet />
                  
                  <Select value={filters.sortBy} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, sortBy: value, page: 1 }))
                  }>
                    <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none px-2 sm:px-3"
                    >
                      <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none px-2 sm:px-3"
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
            <Search className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Start your search</h2>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
              Search for products, blogs, and vendors. Use the search bar above or try one of the trending categories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 