"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Blog from "../models/blog.model";
import { unstable_cache } from "next/cache";

// Get published blogs with 12-hour cache for home page
export const getPublishedBlogsForHome = unstable_cache(
  async (limit: number = 6) => {
    try {
      await connectToDatabase();
      
      const blogs = await Blog.find({ status: "published" })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      if (!blogs || blogs.length === 0) {
        return {
          success: true,
          blogs: [],
          message: "No published blogs found",
        };
      }

      return {
        success: true,
        blogs: JSON.parse(JSON.stringify(blogs)),
        message: "Successfully fetched published blogs for home page",
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        blogs: [],
        message: "Failed to fetch published blogs",
      };
    }
  },
  ["published_blogs_home"],
  {
    revalidate: 43200, // 12 hours
  }
);

// Get featured blogs with 12-hour cache
export const getFeaturedBlogsForHome = unstable_cache(
  async (limit: number = 3) => {
    try {
      await connectToDatabase();
      
      const blogs = await Blog.find({ 
        status: "published",
        featured: true 
      })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      return {
        success: true,
        blogs: JSON.parse(JSON.stringify(blogs)),
        message: "Successfully fetched featured blogs",
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        blogs: [],
        message: "Failed to fetch featured blogs",
      };
    }
  },
  ["featured_blogs_home"],
  {
    revalidate: 43200, // 12 hours
  }
);

// Get blogs by category with 12-hour cache
export const getBlogsByCategory = unstable_cache(
  async (category: string, limit: number = 6) => {
    try {
      await connectToDatabase();
      
      const blogs = await Blog.find({ 
        status: "published",
        category: category
      })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      return {
        success: true,
        blogs: JSON.parse(JSON.stringify(blogs)),
        message: `Successfully fetched blogs for category: ${category}`,
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        blogs: [],
        message: "Failed to fetch blogs by category",
      };
    }
  },
  ["blogs_by_category"],
  {
    revalidate: 43200, // 12 hours
  }
);

// Get blog categories with 12-hour cache
export const getBlogCategories = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      
      const categories = await Blog.distinct("category", { status: "published" });

      return {
        success: true,
        categories: categories,
        message: "Successfully fetched blog categories",
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        categories: [],
        message: "Failed to fetch blog categories",
      };
    }
  },
  ["blog_categories"],
  {
    revalidate: 43200, // 12 hours
  }
); 