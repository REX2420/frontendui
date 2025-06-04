import { NextRequest, NextResponse } from "next/server";
import { getPopularSubcategories } from "@/lib/database/actions/subCategory.actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "8");

    const result = await getPopularSubcategories(limit);

    if (!result?.success) {
      return NextResponse.json(
        {
          success: false,
          message: result?.message || "Failed to fetch popular subcategories",
          data: []
        },
        { status: 500 }
      );
    }

    // Transform data for trending display
    const trendingSubcategories = result.subcategories.map((subcategory: any) => ({
      id: subcategory._id,
      name: subcategory.name,
      slug: subcategory.slug,
      parentCategory: subcategory.parent?.name || "General",
      productCount: subcategory.productCount,
      image: subcategory.images?.[0]?.url || null
    }));

    return NextResponse.json({
      success: true,
      data: trendingSubcategories,
      message: `Successfully fetched ${trendingSubcategories.length} popular subcategories`
    });

  } catch (error: any) {
    console.error("Popular subcategories API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch popular subcategories",
        data: []
      },
      { status: 500 }
    );
  }
} 