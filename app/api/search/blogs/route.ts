import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Blog from "@/lib/database/models/blog.model";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "relevance";
    const status = searchParams.get("status") || "published";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectToDatabase();

    // Build search query
    let searchQuery: any = { status: status };

    // Text search across multiple fields
    if (query.trim()) {
      searchQuery.$or = [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
        { excerpt: { $regex: query, $options: "i" } },
        { authorName: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
        { seoTitle: { $regex: query, $options: "i" } },
        { seoDescription: { $regex: query, $options: "i" } }
      ];
    }

    // Category filter
    if (category && category !== "All") {
      searchQuery.category = category;
    }

    // Build sort criteria
    let sortCriteria: any = {};
    switch (sortBy) {
      case "newest":
        sortCriteria = { publishedAt: -1, createdAt: -1 };
        break;
      case "oldest":
        sortCriteria = { publishedAt: 1, createdAt: 1 };
        break;
      case "popular":
        sortCriteria = { views: -1, likes: -1 };
        break;
      case "likes":
        sortCriteria = { likes: -1, views: -1 };
        break;
      case "views":
        sortCriteria = { views: -1, likes: -1 };
        break;
      case "featured":
        sortCriteria = { featured: -1, publishedAt: -1 };
        break;
      case "relevance":
      default:
        if (query.trim()) {
          // For text search, prioritize title matches, then other fields
          sortCriteria = { 
            featured: -1,
            likes: -1,
            views: -1,
            publishedAt: -1 
          };
        } else {
          sortCriteria = { 
            featured: -1, 
            publishedAt: -1, 
            views: -1 
          };
        }
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search with population of author details
    const [blogs, totalCount] = await Promise.all([
      Blog.find(searchQuery)
        .populate('author', 'name email')
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(searchQuery)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Transform blogs for consistent API response
    const transformedBlogs = blogs.map(blog => ({
      ...blog,
      readingTime: calculateReadingTime(blog.content),
      publishedDate: blog.publishedAt 
        ? new Date(blog.publishedAt).toLocaleDateString()
        : new Date(blog.createdAt).toLocaleDateString(),
      excerpt: blog.excerpt || generateExcerpt(blog.content)
    }));

    return NextResponse.json({
      success: true,
      data: transformedBlogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      },
      searchInfo: {
        query,
        category,
        sortBy,
        status
      }
    });

  } catch (error: any) {
    console.error("Blog search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to search blogs",
        data: []
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate reading time
function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

// Helper function to generate excerpt if not available
function generateExcerpt(content: string, maxLength: number = 150): string {
  // Remove HTML tags if any
  const cleanContent = content.replace(/<[^>]*>/g, '');
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  // Find the last complete word within the limit
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
} 