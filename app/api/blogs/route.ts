import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Blog from "../../../lib/database/models/blog.model";
import { getPublishedBlogsForHome, getBlogsByCategory } from "@/lib/database/actions/blog.actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") || "publishedAt";
    
    // Use cached functions only for simple cases without advanced filters
    const hasAdvancedFilters = featured || (sort !== "publishedAt");
    
    if (!search && page === 1 && !hasAdvancedFilters) {
      if (category && category !== "All" && category !== "") {
        // Use cached category-specific blog fetching
        const result = await getBlogsByCategory(category, limit);
        if (result.success) {
          return NextResponse.json({
            success: true,
            blogs: result.blogs,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalBlogs: result.blogs.length,
              hasNext: false,
              hasPrev: false,
            },
          });
        }
      } else if (!category || category === "All" || category === "") {
        // Use cached home page blog fetching
        const result = await getPublishedBlogsForHome(limit);
        if (result.success) {
          return NextResponse.json({
            success: true,
            blogs: result.blogs,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalBlogs: result.blogs.length,
              hasNext: false,
              hasPrev: false,
            },
          });
        }
      }
    }

    // Dynamic querying for search and advanced filtering
    await connectToDatabase();
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = { status: "published" };
    
    // Category filter - use categoryName field
    if (category && category !== "All" && category !== "") {
      query.categoryName = category;
    }
    
    // Featured filter
    if (featured === "true") {
      query.featured = true;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } }
      ];
    }
    
    // Build sort options
    let sortOptions: any = {};
    switch (sort) {
      case "views":
        sortOptions = { views: -1, publishedAt: -1 };
        break;
      case "likes":
        sortOptions = { likes: -1, publishedAt: -1 };
        break;
      case "title":
        sortOptions = { title: 1 };
        break;
      case "publishedAt":
      default:
        sortOptions = { publishedAt: -1 };
        break;
    }
    
    console.log("Blog query:", JSON.stringify(query, null, 2));
    console.log("Sort options:", sortOptions);
    
    const blogs = await Blog.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);

    console.log(`Found ${blogs.length} blogs, total: ${totalBlogs}`);

    return NextResponse.json({
      success: true,
      blogs: JSON.parse(JSON.stringify(blogs)),
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Get published blogs error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch blogs",
      },
      { status: 500 }
    );
  }
} 