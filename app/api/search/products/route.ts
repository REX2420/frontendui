import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Product from "@/lib/database/models/product.model";
import Category from "@/lib/database/models/category.model";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = parseInt(searchParams.get("minPrice") || "0");
    const maxPrice = parseInt(searchParams.get("maxPrice") || "1000");
    const sortBy = searchParams.get("sortBy") || "relevance";
    const inStock = searchParams.get("inStock") === "true";
    const featured = searchParams.get("featured") === "true";
    const discount = searchParams.get("discount") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectToDatabase();

    // Build search query
    let searchQuery: any = {};

    // Text search across multiple fields
    if (query.trim()) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { longDescription: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { "details.name": { $regex: query, $options: "i" } },
        { "details.value": { $regex: query, $options: "i" } },
        { "benefits.name": { $regex: query, $options: "i" } },
        { "ingredients.name": { $regex: query, $options: "i" } }
      ];
    }

    // Category filter
    if (category && category !== "All") {
      // First, find the category by name
      const categoryDoc = await Category.findOne({ 
        name: { $regex: category, $options: "i" } 
      });
      if (categoryDoc) {
        searchQuery.category = categoryDoc._id;
      }
    }

    // Price filter
    if (minPrice > 0 || maxPrice < 1000) {
      searchQuery["subProducts.sizes.price"] = {
        $gte: minPrice,
        $lte: maxPrice
      };
    }

    // In stock filter
    if (inStock) {
      searchQuery["subProducts.sizes.qty"] = { $gt: 0 };
    }

    // Featured filter
    if (featured) {
      searchQuery.featured = true;
    }

    // Discount filter
    if (discount) {
      searchQuery["subProducts.discount"] = { $gt: 0 };
    }

    // Build sort criteria
    let sortCriteria: any = {};
    switch (sortBy) {
      case "newest":
        sortCriteria = { createdAt: -1 };
        break;
      case "price-low":
        sortCriteria = { "subProducts.sizes.price": 1 };
        break;
      case "price-high":
        sortCriteria = { "subProducts.sizes.price": -1 };
        break;
      case "rating":
        sortCriteria = { rating: -1, numReviews: -1 };
        break;
      case "popular":
        sortCriteria = { "subProducts.sold": -1, numReviews: -1 };
        break;
      case "relevance":
      default:
        // For text search, MongoDB will sort by relevance automatically
        if (query.trim()) {
          sortCriteria = { score: { $meta: "textScore" } };
        } else {
          sortCriteria = { featured: -1, rating: -1, createdAt: -1 };
        }
        break;
    }

    // Create text index for better search if query exists
    if (query.trim()) {
      // Add text score for relevance sorting
      searchQuery.$text = { $search: query };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    let productsQuery = Product.find(searchQuery)
      .populate('category', 'name')
      .skip(skip)
      .limit(limit);

    // Add sorting
    if (query.trim() && sortBy === "relevance") {
      productsQuery = productsQuery.sort({ score: { $meta: "textScore" } });
    } else {
      productsQuery = productsQuery.sort(sortCriteria);
    }

    const [products, totalCount] = await Promise.all([
      productsQuery.lean(),
      Product.countDocuments(searchQuery)
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Transform products for consistent API response
    const transformedProducts = products.map(product => ({
      ...product,
      // Calculate minimum price
      minPrice: product.subProducts?.reduce((min: number, subProduct: any) => {
        const subProductMin = subProduct.sizes?.reduce((subMin: number, size: any) => {
          const finalPrice = subProduct.discount > 0 
            ? size.price * (1 - subProduct.discount / 100)
            : size.price;
          return Math.min(subMin, finalPrice);
        }, Infinity) || Infinity;
        return Math.min(min, subProductMin);
      }, Infinity) || 0,
      
      // Check if in stock
      inStock: product.subProducts?.some((subProduct: any) => 
        subProduct.sizes?.some((size: any) => size.qty > 0)
      ) || false
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
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
        priceRange: [minPrice, maxPrice],
        sortBy,
        filters: {
          inStock,
          featured,
          discount
        }
      }
    });

  } catch (error: any) {
    console.error("Product search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to search products",
        data: []
      },
      { status: 500 }
    );
  }
} 