"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Category from "../models/category.model";
import SubCategory from "../models/subCategory.model";
import { unstable_cache, revalidateTag } from "next/cache";
import Product from "../models/product.model";

// Get all categories with weekly cache
export const getAllCategories = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const categories = await Category.find()
        .sort({ updatedAt: -1 })
        .lean();
        
      return {
        message: "Successfully fetched all categories",
        categories: JSON.parse(JSON.stringify(categories)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch categories",
        categories: [],
        success: false,
      };
    }
  },
  ["all_categories"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["all_categories", "categories"]
  }
);

// Get categories with their subcategory counts for category screens with weekly cache
export const getCategoriesWithSubcategoryCounts = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      
      // Get all categories
      const categories = await Category.find().sort({ updatedAt: -1 }).lean();
      
      // Get subcategory counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: any) => {
          const subcategoryCount = await SubCategory.countDocuments({
            parent: category._id,
          });
          
          return {
            ...category,
            subcategoryCount,
          };
        })
      );

      return {
        message: "Successfully fetched categories with subcategory counts",
        categories: JSON.parse(JSON.stringify(categoriesWithCounts)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch categories with counts",
        categories: [],
        success: false,
      };
    }
  },
  ["categories_with_counts"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["categories", "subcategories"]
  }
);

// Get featured categories for navigation with weekly cache
export const getFeaturedCategories = unstable_cache(
  async (limit: number = 10) => {
    try {
      await connectToDatabase();
      const categories = await Category.find({ featured: true })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
        
      return {
        message: "Successfully fetched featured categories",
        categories: JSON.parse(JSON.stringify(categories)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch featured categories",
        categories: [],
        success: false,
      };
    }
  },
  ["featured_categories"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["featured_categories", "categories"]
  }
);

// Get single category with its subcategories with weekly cache
export const getCategoryWithSubcategories = unstable_cache(
  async (categoryId: string) => {
    try {
      await connectToDatabase();
      
      const category = await Category.findById(categoryId).lean();
      if (!category) {
        return {
          message: "Category not found",
          category: null,
          subcategories: [],
          success: false,
        };
      }

      const subcategories = await SubCategory.find({ parent: categoryId })
        .sort({ updatedAt: -1 })
        .lean();

      return {
        message: "Successfully fetched category with subcategories",
        category: JSON.parse(JSON.stringify(category)),
        subcategories: JSON.parse(JSON.stringify(subcategories)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch category with subcategories",
        category: null,
        subcategories: [],
        success: false,
      };
    }
  },
  ["category_with_subcategories"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["categories", "subcategories"]
  }
);

// Get categories with their product counts for category screens with weekly cache
export const getCategoriesWithProductCounts = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      
      // Get all categories
      const categories = await Category.find()
        .sort({ updatedAt: -1 })
        .lean();
      
      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: any) => {
          const productCount = await Product.countDocuments({
            category: category._id,
          });
          
          return {
            ...category,
            productCount,
          };
        })
      );

      return {
        message: "Successfully fetched categories with product counts",
        categories: JSON.parse(JSON.stringify(categoriesWithCounts)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch categories with counts",
        categories: [],
        success: false,
      };
    }
  },
  ["categories_with_counts"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["categories_with_counts", "categories", "products"]
  }
);

// Utility function to revalidate categories cache
export const revalidateCategoriesCache = async () => {
  try {
    revalidateTag("categories");
    revalidateTag("subcategories");
    revalidateTag("parent_subCategories");
    return { success: true, message: "Cache revalidated successfully" };
  } catch (error) {
    handleError(error);
    return { success: false, message: "Failed to revalidate cache" };
  }
};
