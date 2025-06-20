import { NextRequest, NextResponse } from "next/server";
import { SearchServiceFactory } from "@/lib/search/SearchServiceFactory";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      searchTerm: searchParams.get("q") || "",
      category: searchParams.get("category") || "",
      minPrice: parseFloat(searchParams.get("minPrice") || "0"),
      maxPrice: parseFloat(searchParams.get("maxPrice") || "999999"),
      sortBy: searchParams.get("sortBy") || "relevance",
      inStock: searchParams.get("inStock") === "true",
      featured: searchParams.get("featured") === "true", 
      discount: searchParams.get("discount") === "true",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20")
    };

    // Get search service (Elasticsearch or MongoDB)
    const searchService = await SearchServiceFactory.create();
    
    // Execute search
    const result = await searchService.searchProducts(filters);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("🚨 Search error:", error);
    return NextResponse.json(
      {
        success: false,
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalResults: 0,
          hasNext: false,
          hasPrev: false,
          limit: 20
        },
        message: error.message || "Search failed",
        engine: 'error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 