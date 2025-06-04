import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/database/mongodb";
import Blog from "@/lib/database/models/blog.model";
import { buildOptimizedBlogPipeline, buildCountPipeline } from "@/utils/searchPipeline";
import { 
  getCachedData, 
  setCachedData, 
  generateBlogCacheKey 
} from "@/utils/searchCache";
import { withPerformanceMonitoring } from "@/utils/queryAnalyzer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "relevance";
    const status = searchParams.get("status") || "published";
    const featured = searchParams.get("featured") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Generate cache key
    const cacheKey = generateBlogCacheKey({
      query,
      category,
      sortBy,
      status,
      featured,
      page,
      limit
    });

    // Try to get from cache first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Connect to database with optimized connection
    await dbConnect();

    // Build optimized aggregation pipeline
    const pipeline = buildOptimizedBlogPipeline({
      searchTerm: query,
      category,
      status,
      featured,
      sortBy,
      page,
      limit
    });

    // Build count pipeline for pagination
    const countPipeline = buildCountPipeline(pipeline);

    // Execute both queries in parallel with performance monitoring
    const [blogs, totalCountResult] = await Promise.all([
      withPerformanceMonitoring(
        () => Blog.aggregate(pipeline),
        `Blog Search - Page ${page}`
      ),
      withPerformanceMonitoring(
        () => Blog.aggregate(countPipeline),
        `Blog Count - ${query || 'Browse'}`
      )
    ]);

    const totalBlogs = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalBlogs / limit);

    // Transform blogs data for consistent response
    const transformedBlogs = blogs.map((blog: any) => ({
      ...blog,
      readingTime: calculateReadingTime(blog.content || ""),
      publishedDate: blog.publishedAt 
        ? new Date(blog.publishedAt).toLocaleDateString()
        : new Date(blog.createdAt).toLocaleDateString(),
      excerpt: blog.excerpt || generateExcerpt(blog.content || "")
    }));

    const result = {
      success: true,
      data: transformedBlogs,
      blogs: transformedBlogs, // For compatibility with existing frontend
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalBlogs,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      },
      searchInfo: {
        query,
        category,
        sortBy,
        status,
        featured
      },
      message: `Found ${totalBlogs} blogs`,
      cached: false
    };

    // Cache the result (TTL: 5 minutes for search results)
    await setCachedData(cacheKey, { ...result, cached: true }, 300);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("🚨 Blog search error:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        blogs: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalResults: 0,
          hasNext: false,
          hasPrev: false,
          limit: 20
        },
        message: error.message || "Failed to search blogs",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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