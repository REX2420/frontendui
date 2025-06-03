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
    
    // Use cached functions for simple cases without search
    if (!search && page === 1) {
      if (category && category !== "All") {
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
      } else if (!category || category === "All") {
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

    // Fallback to dynamic querying for complex cases (search, pagination)
    await connectToDatabase();
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = { status: "published" };
    
    if (category && category !== "All") {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } }
      ];
    }
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);

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