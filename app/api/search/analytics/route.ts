import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/database/mongodb";

// Simple in-memory cache for search analytics (in production, use Redis or database)
let searchAnalytics: { [key: string]: { count: number, lastSearched: Date } } = {};

export async function POST(request: NextRequest) {
  try {
    const { searchTerm, resultCount, searchDuration } = await request.json();
    
    if (!searchTerm || typeof searchTerm !== 'string') {
      return NextResponse.json(
        { success: false, message: "Search term is required" },
        { status: 400 }
      );
    }

    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      return NextResponse.json(
        { success: false, message: "Search term too short" },
        { status: 400 }
      );
    }

    // Update search analytics
    if (searchAnalytics[term]) {
      searchAnalytics[term].count += 1;
      searchAnalytics[term].lastSearched = new Date();
    } else {
      searchAnalytics[term] = {
        count: 1,
        lastSearched: new Date()
      };
    }

    // Optional: Save to database for persistent analytics
    try {
      await dbConnect();
      // You can create a SearchAnalytics model and save here
      console.log(`📊 Search Analytics: "${term}" searched ${searchAnalytics[term].count} times`);
    } catch (dbError) {
      console.warn("Failed to save search analytics to database:", dbError);
    }

    return NextResponse.json({
      success: true,
      message: "Search analytics saved",
      analytics: {
        term,
        count: searchAnalytics[term].count,
        resultCount,
        searchDuration
      }
    });

  } catch (error: any) {
    console.error("Search analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save analytics" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get popular search terms
    const popularSearches = Object.entries(searchAnalytics)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([term, data]) => ({
        term,
        count: data.count,
        lastSearched: data.lastSearched
      }));

    return NextResponse.json({
      success: true,
      popularSearches,
      totalUniqueSearches: Object.keys(searchAnalytics).length
    });

  } catch (error: any) {
    console.error("Get search analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get analytics" },
      { status: 500 }
    );
  }
} 