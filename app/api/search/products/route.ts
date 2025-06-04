import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/database/mongodb";
import Product from "@/lib/database/models/product.model";
import { buildOptimizedProductPipeline, buildCountPipeline } from "@/utils/searchPipeline";
import { 
  getCachedData, 
  setCachedData, 
  generateProductCacheKey 
} from "@/utils/searchCache";
import { withPerformanceMonitoring } from "@/utils/queryAnalyzer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const sortBy = searchParams.get("sortBy") || "relevance";
    const inStock = searchParams.get("inStock") === "true";
    const featured = searchParams.get("featured") === "true";
    const discount = searchParams.get("discount") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Generate cache key
    const cacheKey = generateProductCacheKey({
      query,
      category,
      minPrice,
      maxPrice,
      sortBy,
      inStock,
      featured,
      discount,
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
    const pipeline = buildOptimizedProductPipeline({
      searchTerm: query,
      category,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      inStock,
      featured,
      discount
    });

    // Build count pipeline for pagination
    const countPipeline = buildCountPipeline(pipeline);

    // Execute both queries in parallel with performance monitoring
    const [products, totalCountResult] = await Promise.all([
      withPerformanceMonitoring(
        () => Product.aggregate(pipeline),
        `Product Search - Page ${page}`
      ),
      withPerformanceMonitoring(
        () => Product.aggregate(countPipeline),
        `Product Count - ${query || 'Browse'}`
      )
    ]);

    const totalProducts = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalProducts / limit);

    // Transform products data for consistent response
    const transformedProducts = products.map((product: any) => ({
      ...product,
      subProducts: product.subProducts?.map((sub: any) => ({
        ...sub,
        images: sub.images || [],
        sizes: sub.sizes || [],
        discount: sub.discount || 0
      })) || []
    }));

    const result = {
      success: true,
      products: transformedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      },
      searchInfo: {
        query,
        category,
        priceRange: [minPrice, maxPrice === 999999 ? 1000 : maxPrice],
        sortBy,
        filters: {
          inStock,
          featured,
          discount
        }
      },
      message: `Found ${totalProducts} products`,
      cached: false
    };

    // Cache the result (TTL: 5 minutes for search results)
    await setCachedData(cacheKey, { ...result, cached: true }, 300);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("🚨 Product search error:", error);
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
          limit: 10
        },
        message: error.message || "Failed to search products",
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 