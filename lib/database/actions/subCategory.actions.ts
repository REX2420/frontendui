"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import SubCategory from "../models/subCategory.model";
import Category from "../models/category.model";
import Product from "../models/product.model";
import { unstable_cache, revalidateTag } from "next/cache";

// Get all sub categories by its parent(category) id with weekly cache
export const getAllSubCategoriesByParentId = unstable_cache(
  async (parentId: string) => {
    try {
      await connectToDatabase();
      const subCategoriesByParentId = await SubCategory.find({
        parent: parentId,
      }).lean();
      return {
        message:
          "Successfully fetched all sub categories related to it's parent ID",
        subCategories: JSON.parse(JSON.stringify(subCategoriesByParentId)),
        success: true,
      };
    } catch (error) {
      handleError(error);
    }
  },
  ["parent_subCategories"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["subcategories"]
  }
);

// Get all sub categories by its parent name with weekly cache
export const getAllSubCategoriesByName = unstable_cache(
  async (name: string) => {
    try {
      await connectToDatabase();

      // Step 1: Find the parent category by name
      const parentCategory: any = await Category.findOne({ name }).lean();
      if (!parentCategory) {
        return {
          message: "Parent category not found.",
          subCategories: [],
          success: false,
        };
      }

      const parentId = parentCategory._id;

      // Step 2: Find subcategories by parent ID
      const subCategoriesByParentId = await SubCategory.find({
        parent: parentId,
      }).lean();

      return {
        message:
          "Successfully fetched all subcategories related to the parent category name",
        subCategories: JSON.parse(JSON.stringify(subCategoriesByParentId)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "An error occurred while fetching subcategories",
        subCategories: [],
        success: false,
      };
    }
  },
  ["subCategories"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["subcategories"]
  }
);

// Get all subcategories with their product counts for subcategory screens with weekly cache
export const getSubcategoriesWithProductCounts = unstable_cache(
  async (parentId?: string) => {
    try {
      await connectToDatabase();
      
      // Build query based on whether parentId is provided
      const query = parentId ? { parent: parentId } : {};
      
      // Get subcategories
      const subcategories = await SubCategory.find(query)
        .populate({
          path: "parent",
          model: Category,
          select: "name"
        })
        .sort({ updatedAt: -1 })
        .lean();
      
      // Get product counts for each subcategory
      const subcategoriesWithCounts = await Promise.all(
        subcategories.map(async (subcategory: any) => {
          const productCount = await Product.countDocuments({
            subCategories: { $in: [subcategory._id] },
          });
          
          return {
            ...subcategory,
            productCount,
          };
        })
      );

      return {
        message: "Successfully fetched subcategories with product counts",
        subcategories: JSON.parse(JSON.stringify(subcategoriesWithCounts)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch subcategories with counts",
        subcategories: [],
        success: false,
      };
    }
  },
  ["subcategories_with_counts"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["subcategories", "products"]
  }
);

// Get all subcategories for navigation/dropdown with weekly cache
export const getAllSubcategoriesForNavigation = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      
      const subcategories = await SubCategory.find()
        .populate({
          path: "parent",
          model: Category,
          select: "name"
        })
        .sort({ updatedAt: -1 })
        .lean();

      return {
        message: "Successfully fetched all subcategories for navigation",
        subcategories: JSON.parse(JSON.stringify(subcategories)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch subcategories for navigation",
        subcategories: [],
        success: false,
      };
    }
  },
  ["subcategories_navigation"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["subcategories"]
  }
);

// Get popular subcategories based on product count with weekly cache
export const getPopularSubcategories = unstable_cache(
  async (limit: number = 10) => {
    try {
      await connectToDatabase();
      
      // Get all subcategories with their product counts
      const subcategories = await SubCategory.find()
        .populate({
          path: "parent",
          model: Category,
          select: "name"
        })
        .lean();
      
      // Calculate product counts and sort by popularity
      const subcategoriesWithCounts = await Promise.all(
        subcategories.map(async (subcategory: any) => {
          const productCount = await Product.countDocuments({
            subCategories: { $in: [subcategory._id] },
          });
          
          return {
            ...subcategory,
            productCount,
          };
        })
      );

      // Sort by product count (most popular first) and limit results
      const popularSubcategories = subcategoriesWithCounts
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, limit);

      return {
        message: "Successfully fetched popular subcategories",
        subcategories: JSON.parse(JSON.stringify(popularSubcategories)),
        success: true,
      };
    } catch (error) {
      handleError(error);
      return {
        message: "Failed to fetch popular subcategories",
        subcategories: [],
        success: false,
      };
    }
  },
  ["popular_subcategories"],
  {
    revalidate: 604800, // 7 days (weekly)
    tags: ["subcategories", "products"]
  }
);

// Utility function to revalidate subcategory cache
export const revalidateSubcategoryCache = async () => {
  try {
    revalidateTag("subcategories");
    revalidateTag("parent_subCategories");
    revalidateTag("subCategories");
    return { success: true, message: "Subcategory cache revalidated successfully" };
  } catch (error) {
    handleError(error);
    return { success: false, message: "Failed to revalidate subcategory cache" };
  }
};
