"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Grid3X3 } from "lucide-react";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { getAllSubCategoriesByParentId } from "@/lib/database/actions/subCategory.actions";
import { handleError } from "@/lib/utils";

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

interface MobileCategoryMenuProps {
  onClose: () => void;
}

const MobileCategoryMenu = ({ onClose }: MobileCategoryMenuProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, SubCategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getAllCategories();
        if (response?.success) {
          const categoriesData = response.categories || [];
          setCategories(categoriesData);
          
          // Fetch subcategories for each category
          const subCatPromises = categoriesData.map(async (category: Category) => {
            try {
              const subCatResponse = await getAllSubCategoriesByParentId(category._id);
              return {
                categoryId: category._id,
                subCategories: subCatResponse?.subCategories || []
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="text-sm text-muted-foreground">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* All Categories Link */}
      <Link href="/categories" onClick={onClose}>
        <div className="flex items-center justify-between p-4 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-orange-200 dark:hover:border-orange-800">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-muted group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
              <Grid3X3 
                size={20} 
                className="text-muted-foreground group-hover:text-orange-500 transition-colors" 
              />
            </div>
            <span className="font-medium text-foreground group-hover:text-orange-600 transition-colors">
              All Categories
            </span>
          </div>
          <ChevronRight 
            size={20} 
            className="text-muted-foreground group-hover:text-orange-500 transition-colors" 
          />
        </div>
      </Link>

      {/* Individual Categories */}
      {categories.map((category) => {
        const categorySubCategories = subCategories[category._id] || [];
        const isExpanded = expandedCategories.has(category._id);
        const hasSubCategories = categorySubCategories.length > 0;

        return (
          <div key={category._id}>
            {hasSubCategories ? (
              // Category with subcategories - expandable
              <div>
                <div 
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                  onClick={() => toggleCategory(category._id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-muted group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                      <Grid3X3 
                        size={20} 
                        className="text-muted-foreground group-hover:text-orange-500 transition-colors" 
                      />
                    </div>
                    <span className="font-medium text-foreground group-hover:text-orange-600 transition-colors capitalize">
                      {category.name}
                    </span>
                  </div>
                  <ChevronDown 
                    size={20} 
                    className={`text-muted-foreground group-hover:text-orange-500 transition-all duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                
                {/* Subcategories */}
                {isExpanded && (
                  <div className="ml-6 mt-2 space-y-1">
                    {/* All items in this category */}
                    <Link 
                      href={`/shop?category=${category._id}&name=${category.name}`}
                      onClick={onClose}
                    >
                      <div className="flex items-center p-3 rounded-md hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors cursor-pointer">
                        <span className="text-sm font-medium text-muted-foreground hover:text-orange-600">
                          All {category.name}
                        </span>
                      </div>
                    </Link>
                    
                    {/* Individual subcategories */}
                    {categorySubCategories.map((subCategory) => (
                      <Link 
                        key={subCategory._id}
                        href={`/shop?subCategory=${subCategory._id}&category=${category._id}&name=${subCategory.name}`}
                        onClick={onClose}
                      >
                        <div className="flex items-center p-3 rounded-md hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors cursor-pointer">
                          <span className="text-sm text-muted-foreground hover:text-orange-600 capitalize">
                            {subCategory.name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Category without subcategories - direct link
              <Link 
                href={`/shop?category=${category._id}&name=${category.name}`}
                onClick={onClose}
              >
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-200 cursor-pointer group border border-transparent hover:border-orange-200 dark:hover:border-orange-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-muted group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                      <Grid3X3 
                        size={20} 
                        className="text-muted-foreground group-hover:text-orange-500 transition-colors" 
                      />
                    </div>
                    <span className="font-medium text-foreground group-hover:text-orange-600 transition-colors capitalize">
                      {category.name}
                    </span>
                  </div>
                  <ChevronRight 
                    size={20} 
                    className="text-muted-foreground group-hover:text-orange-500 transition-colors" 
                  />
                </div>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MobileCategoryMenu; 