"use server";

import { handleError } from "@/lib/utils";
import { connectToDatabase } from "../connect";
import Blog from "../models/blog.model";
import { unstable_cache, revalidateTag } from "next/cache";

// Helper function to invalidate blog caches
function invalidateBlogCaches() {
  try {
    console.log('🗑️ Invalidating all blog caches...');
    
    // Invalidate all blog-related tags
    revalidateTag('blogs');
    revalidateTag('blog');
    revalidateTag('homepage');
    revalidateTag('featured-blogs');
    revalidateTag('blog-categories');
    
    console.log('✅ Blog caches invalidated successfully');
  } catch (error) {
    console.error('❌ Error invalidating blog caches:', error);
  }
}

// Get published blogs with 30-minute cache
export const getPublishedBlogsForHome = unstable_cache(
  async (limit: number = 6) => {
    try {
      await connectToDatabase();
      
      const blogs = await Blog.find({ 
        status: "published" 
      })
        .populate('category', 'name') // Populate category if it's an ObjectId reference
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      // Transform the blogs to ensure category is a string
      const transformedBlogs = blogs.map(blog => {
        let categoryName = blog.category;
        
        // If category is populated (ObjectId reference), get the name
        if (typeof blog.category === 'object' && blog.category?.name) {
          categoryName = blog.category.name;
        }
        
        return {
          ...blog,
          category: categoryName || 'Uncategorized'
        };
      });

      return {
        success: true,
        blogs: JSON.parse(JSON.stringify(transformedBlogs)),
        message: "Successfully fetched published blogs",
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
    revalidate: 1800, // 30 minutes
    tags: ["published_blogs_home", "blogs", "homepage"],
  }
);

// Get featured blogs with 30-minute cache
export const getFeaturedBlogsForHome = unstable_cache(
  async (limit: number = 3) => {
    try {
      await connectToDatabase();
      
      const blogs = await Blog.find({ 
        status: "published",
        featured: true 
      })
        .populate('category', 'name') // Populate category if it's an ObjectId reference
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      // Transform the blogs to ensure category is a string
      const transformedBlogs = blogs.map(blog => {
        let categoryName = blog.category;
        
        // If category is populated (ObjectId reference), get the name
        if (typeof blog.category === 'object' && blog.category?.name) {
          categoryName = blog.category.name;
        }
        
        return {
          ...blog,
          category: categoryName || 'Uncategorized'
        };
      });

      return {
        success: true,
        blogs: JSON.parse(JSON.stringify(transformedBlogs)),
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
    revalidate: 1800, // 30 minutes
    tags: ["featured_blogs_home", "blogs", "homepage"],
  }
);

// Get blogs by category with 30-minute cache
export const getBlogsByCategory = unstable_cache(
  async (category: string, limit: number = 6) => {
    try {
      await connectToDatabase();
      
      const blogs = await Blog.find({ 
        status: "published",
        category: category
      })
        .populate('category', 'name') // Populate category if it's an ObjectId reference
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();

      // Transform the blogs to ensure category is a string
      const transformedBlogs = blogs.map(blog => {
        let categoryName = blog.category;
        
        // If category is populated (ObjectId reference), get the name
        if (typeof blog.category === 'object' && blog.category?.name) {
          categoryName = blog.category.name;
        }
        
        return {
          ...blog,
          category: categoryName || 'Uncategorized'
        };
      });

      return {
        success: true,
        blogs: JSON.parse(JSON.stringify(transformedBlogs)),
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
    revalidate: 1800, // 30 minutes
    tags: ["blogs", "blog-categories"],
  }
);

// Get blog categories with 30-minute cache
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
    revalidate: 1800, // 30 minutes
    tags: ["blogs", "blog-categories"],
  }
);

// Get single blog by slug with 30-minute cache
export const getSingleBlog = unstable_cache(
  async (slug: string) => {
    try {
      await connectToDatabase();
      
      const blog = await Blog.findOne({ 
        slug, 
        status: "published" 
      }).lean();

      if (!blog) {
        return {
          success: false,
          blog: null,
          message: "Blog not found",
        };
      }

      return {
        success: true,
        blog: JSON.parse(JSON.stringify(blog)),
        message: "Successfully fetched blog",
      };
    } catch (error) {
      handleError(error);
      return {
        success: false,
        blog: null,
        message: "Failed to fetch blog",
      };
    }
  },
  ["single_blog"],
  {
    revalidate: 1800, // 30 minutes
    tags: ["blog", "blogs"],
  }
);

// Export the cache invalidation function for use in other files
export { invalidateBlogCaches }; 