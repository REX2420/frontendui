import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Category from "@/lib/database/models/category.model";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const categories = await Category.find({ status: "active" })
      .select("name")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      categories: JSON.parse(JSON.stringify(categories)),
    });
  } catch (error: any) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch categories",
        categories: [],
      },
      { status: 500 }
    );
  }
} 