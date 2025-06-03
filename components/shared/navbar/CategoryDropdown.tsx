"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Grid3X3, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

const CategoryDropdown = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, SubCategory[]>>({});
  const [loading, setLoading] = useState(true);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-sm font-medium text-foreground hover:text-primary group transition duration-300 h-auto p-2"
        >
          <Grid3X3 size={20} className="mr-2" />
          CATEGORIES
          <ChevronDown size={16} className="ml-2 transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="start">
        <div className="px-3 py-2">
          <Link href="/categories">
            <DropdownMenuItem className="cursor-pointer rounded-md p-3 hover:bg-primary/10">
              <Grid3X3 className="mr-3 h-4 w-4" />
              <div>
                <div className="font-medium">All Categories</div>
                <div className="text-xs text-muted-foreground">
                  View all product categories
                </div>
              </div>
              <ArrowRight className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          </Link>
        </div>
        
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="text-sm text-muted-foreground">Loading categories...</div>
          </div>
        ) : categories.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {categories.map((category) => {
              const categorySubCategories = subCategories[category._id] || [];
              
              if (categorySubCategories.length > 0) {
                // Category with subcategories - show as submenu
                return (
                  <DropdownMenuSub key={category._id}>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <div className="flex items-center">
                        <div className="capitalize font-medium">{category.name}</div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          {categorySubCategories.length} items
                        </div>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64">
                      <Link href={`/shop?category=${category._id}&name=${category.name}`}>
                        <DropdownMenuItem className="cursor-pointer font-medium hover:bg-primary/10">
                          <Grid3X3 className="mr-2 h-4 w-4" />
                          All {category.name}
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      {categorySubCategories.map((subCategory) => (
                        <Link 
                          key={subCategory._id} 
                          href={`/shop?subCategory=${subCategory._id}&category=${category._id}&name=${subCategory.name}`}
                        >
                          <DropdownMenuItem className="cursor-pointer hover:bg-accent">
                            <div className="capitalize">{subCategory.name}</div>
                          </DropdownMenuItem>
                        </Link>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              } else {
                // Category without subcategories - direct link
                return (
                  <Link 
                    key={category._id} 
                    href={`/shop?category=${category._id}&name=${category.name}`}
                  >
                    <DropdownMenuItem className="cursor-pointer hover:bg-accent">
                      <div className="capitalize font-medium">{category.name}</div>
                    </DropdownMenuItem>
                  </Link>
                );
              }
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <div className="text-sm text-muted-foreground">No categories found</div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoryDropdown; 