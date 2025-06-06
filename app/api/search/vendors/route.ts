import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/database/mongodb";
import Vendor from "@/lib/database/models/vendor.model";
import { buildOptimizedVendorPipeline, buildCountPipeline } from "@/utils/searchPipeline";
import { withPerformanceMonitoring } from "@/utils/queryAnalyzer";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const sortBy = searchParams.get("sortBy") || "relevance";
    const verified = searchParams.get("verified");
    const location = searchParams.get("location") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Connect to database with optimized connection
    await dbConnect();

    // Build optimized aggregation pipeline
    const pipeline = buildOptimizedVendorPipeline({
      searchTerm: query,
      verified: verified === "true" ? true : verified === "false" ? false : undefined,
      location,
      sortBy,
      page,
      limit
    });

    // Build count pipeline for pagination
    const countPipeline = buildCountPipeline(pipeline);

    // Execute both queries in parallel with performance monitoring
    const [vendors, totalCountResult] = await Promise.all([
      withPerformanceMonitoring(
        () => Vendor.aggregate(pipeline),
        `Vendor Search - Page ${page}`
      ),
      withPerformanceMonitoring(
        () => Vendor.aggregate(countPipeline),
        `Vendor Count - ${query || 'Browse'}`
      )
    ]);

    const totalVendors = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(totalVendors / limit);

    const result = {
      success: true,
      vendors,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalVendors,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      },
      searchInfo: {
        query,
        verified: verified === "true" ? true : verified === "false" ? false : undefined,
        location,
        sortBy
      },
      message: `Found ${totalVendors} vendors`,
      cached: false,
      engine: 'mongodb'
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("🚨 Vendor search error:", error);
    return NextResponse.json(
      {
        success: false,
        vendors: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalResults: 0,
          hasNext: false,
          hasPrev: false,
          limit: 20
        },
        message: error.message || "Vendor search failed",
        cached: false,
        engine: 'error'
      },
      { status: 500 }
    );
  }
}

// Helper function to mask email for privacy
function maskEmail(email: string): string {
  if (!email) return "";
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }
  
  const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  return `${maskedUsername}@${domain}`;
} 