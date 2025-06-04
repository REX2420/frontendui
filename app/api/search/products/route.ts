import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";
import Category from "@/lib/database/models/category.model";

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

    await connectToDatabase();

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build the search query
    const searchQuery: any = {};
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } }
      ];
    }

    if (category && category !== "All") {
      searchQuery.category = category;
    }

    // Price filtering
    searchQuery["subProducts.sizes.price"] = {
      $gte: minPrice,
      $lte: maxPrice === 999999 ? 1000 : maxPrice
    };

    if (inStock) {
      searchQuery["subProducts.sizes.qty"] = { $gt: 0 };
    }

    if (featured) {
      searchQuery.isFeatured = true;
    }

    if (discount) {
      searchQuery["subProducts.discount"] = { $gt: 0 };
    }

    // Build sort query
    let sortQuery: any = {};
    switch (sortBy) {
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "price-low":
        sortQuery = { "subProducts.sizes.price": 1 };
        break;
      case "price-high":
        sortQuery = { "subProducts.sizes.price": -1 };
        break;
      case "rating":
        sortQuery = { averageRating: -1 };
        break;
      case "popularity":
        sortQuery = { views: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalProducts / limit);

    // Execute search with pagination
    const products = await Product.find(searchQuery)
      .populate("category", "name")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform products data
    const transformedProducts = products.map((product: any) => ({
      ...product,
      subProducts: product.subProducts?.map((sub: any) => ({
        ...sub,
        images: sub.images || [],
        sizes: sub.sizes || [],
        discount: sub.discount || 0
      })) || []
    }));

    return NextResponse.json({
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
      message: `Found ${totalProducts} products`
    });

  } catch (error) {
    console.error("Product search error:", error);
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
        message: "Failed to search products"
      },
      { status: 500 }
    );
  }
} 