"use client";

import { Button } from "@/components/ui/button";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { getAllSubCategoriesByParentId } from "@/lib/database/actions/subCategory.actions";
import { handleError } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Loader2, Grid3X3, ArrowRight, ChevronDown, ChevronRight, Package } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  images?: Array<{ url: string; public_id: string }>;
}

interface SubCategory {
  _id: string;
  name: string;
  parent: string;
  images?: Array<{ url: string; public_id: string }>;
}

const CategoriesPageComponent = () => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, SubCategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Cache data in localStorage
  const cacheKey = 'vibecart_categories_data';
  const cacheExpiry = 30 * 60 * 1000; // 30 minutes

  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheExpiry) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };

  const setCachedData = (data: any) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedData = getCachedData();
        if (cachedData) {
          setAllCategories(cachedData.categories || []);
          setSubCategories(cachedData.subCategories || {});
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const response = await getAllCategories();
        if (response?.success) {
          const categoriesData = response.categories || [];
          setAllCategories(categoriesData);
          
          // Fetch subcategories for each category
          const subCatPromises = categoriesData.map(async (category: Category) => {
            try {
              const subCatResponse = await getAllSubCategoriesByParentId(category._id);
              return {
                categoryId: category._id,
                subCategories: subCatResponse?.subcategories || []
              };
            } catch (error) {
              handleError(error);
              return { categoryId: category._id, subCategories: [] };
            }
          });
          
          const subCatResults = await Promise.all(subCatPromises);
          const subCatMap: Record<string, SubCategory[]> = {};
          
          subCatResults.forEach(({ categoryId, subCategories }) => {
            subCatMap[categoryId] = subCategories;
          });
          
          setSubCategories(subCatMap);
          
          // Cache the data
          setCachedData({
            categories: categoriesData,
            subCategories: subCatMap
          });
        }
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Memoized calculations for performance
  const categoriesWithSubcounts = useMemo(() => {
    return allCategories.map(category => ({
      ...category,
      subcategoryCount: subCategories[category._id]?.length || 0
    }));
  }, [allCategories, subCategories]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-7xl">
        {/* Breadcrumb Skeleton */}
        <div className="flex mb-6 sm:mb-8">
          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
        </div>

        {/* Header Skeleton */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted rounded mr-3 animate-pulse"></div>
            <div className="h-8 sm:h-10 bg-muted rounded w-48 sm:w-64 animate-pulse"></div>
          </div>
          <div className="h-5 sm:h-6 bg-muted rounded w-80 sm:w-96 mx-auto animate-pulse"></div>
        </div>

        {/* Categories Skeleton */}
        <div className="space-y-4 sm:space-y-6">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="bg-card rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg sm:rounded-xl animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-6 sm:h-8 bg-muted rounded w-32 sm:w-48 mb-2 animate-pulse"></div>
                    <div className="h-3 sm:h-4 bg-muted rounded w-24 sm:w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-3">
                  <div className="h-8 sm:h-9 bg-muted rounded w-20 sm:w-24 animate-pulse"></div>
                  <div className="h-8 w-8 sm:h-9 sm:w-9 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-12 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex mb-6 sm:mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-muted-foreground">/</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">All Categories</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center mb-4">
          <Grid3X3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2 sm:mr-3" />
          <h1 className="text-2xl sm:text-4xl font-bold text-foreground">All Categories</h1>
        </div>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-6 px-4">
          Explore our complete range of product categories. Click on any category to discover subcategories and products.
        </p>
        
        {/* Expand/Collapse All Controls */}
        {categoriesWithSubcounts.some(cat => cat.subcategoryCount > 0) && (
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const categoriesWithSubs = categoriesWithSubcounts
                  .filter(cat => cat.subcategoryCount > 0)
                  .map(cat => cat._id);
                setExpandedCategories(new Set(categoriesWithSubs));
              }}
              className="text-xs sm:text-sm h-9 px-3 sm:px-4"
            >
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Expand All</span>
              <span className="xs:hidden">Expand</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedCategories(new Set())}
              className="text-xs sm:text-sm h-9 px-3 sm:px-4"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Collapse All</span>
              <span className="xs:hidden">Collapse</span>
            </Button>
          </div>
        )}
      </div>

      {/* Categories with Dropdown Subcategories */}
      {categoriesWithSubcounts.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {categoriesWithSubcounts.map((category) => {
            const categorySubCategories = subCategories[category._id] || [];
            const isExpanded = expandedCategories.has(category._id);
            const hasSubCategories = categorySubCategories.length > 0;

            return (
              <div key={category._id} className="bg-card rounded-xl sm:rounded-2xl border shadow-sm overflow-hidden">
                {/* Category Header */}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      {/* Category Image */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={category.images?.[0]?.url || "/placeholder.jpg"}
                          alt={category.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Category Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-2xl font-bold capitalize text-foreground mb-1 sm:mb-2 truncate">
                          {category.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden xs:inline">
                              {hasSubCategories ? `${category.subcategoryCount} subcategories` : 'Direct category'}
                            </span>
                            <span className="xs:hidden">
                              {hasSubCategories ? `${category.subcategoryCount} subs` : 'Direct'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0">
                      <Link href={`/shop?category=${category._id}&name=${category.name}`} className="flex-1 sm:flex-initial">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm h-9 px-3 sm:px-4">
                          <span className="hidden xs:inline">View All</span>
                          <span className="xs:hidden">View</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                        </Button>
                      </Link>
                      
                      {hasSubCategories && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCategory(category._id)}
                          className="p-2 h-9 w-9 flex-shrink-0"
                        >
                          <ChevronDown 
                            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subcategories Dropdown */}
                {hasSubCategories && isExpanded && (
                  <div className="border-t bg-muted/30">
                    <div className="p-4 sm:p-6">
                      <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 sm:mb-4">
                        Subcategories in {category.name}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {categorySubCategories.map((subCategory) => (
                          <Link 
                            key={subCategory._id}
                            href={`/shop?subCategory=${subCategory._id}&category=${category._id}&name=${subCategory.name}`}
                          >
                            <div className="bg-background rounded-lg p-3 sm:p-4 hover:bg-accent transition-colors duration-200 cursor-pointer group border touch-manipulation">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                                  {subCategory.images?.[0]?.url ? (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                      <Image
                                        src={subCategory.images[0].url}
                                        alt={subCategory.name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <Package className="w-3 h-3 sm:w-5 sm:h-5 text-primary" />
                                    </div>
                                  )}
                                  <span className="text-sm sm:text-base font-medium capitalize text-foreground group-hover:text-primary transition-colors truncate">
                                    {subCategory.name}
                                  </span>
                                </div>
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 px-4">
          <Grid3X3 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-muted-foreground mb-2">No categories found</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Categories will appear here once they are added. Check back later!
          </p>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 sm:mt-16 text-center px-4">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl sm:rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Can't find what you're looking for?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
            Browse all our products or use our search feature to find exactly what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/shop" className="w-full sm:w-auto">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                Browse All Products
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPageComponent; 