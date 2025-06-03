"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Category from "../models/category.model";
import { unstable_cache, revalidateTag } from "next/cache";

export const getAllCategories = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const categories = await Category.find().sort({ updatedAt: -1 }).lean();
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
    revalidate: 1800, // 30 minutes
    tags: ["categories"]
  }
);

// Utility function to revalidate categories cache
export const revalidateCategoriesCache = async () => {
  try {
    revalidateTag("categories");
    revalidateTag("parent_subCategories");
    return { success: true, message: "Cache revalidated successfully" };
  } catch (error) {
    handleError(error);
    return { success: false, message: "Failed to revalidate cache" };
  }
};
