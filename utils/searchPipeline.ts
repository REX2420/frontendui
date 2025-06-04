import mongoose from 'mongoose';

interface PipelineOptions {
  searchTerm?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  limit: number;
  sortBy?: string;
  inStock?: boolean;
  featured?: boolean;
  discount?: boolean;
}

interface BlogPipelineOptions {
  searchTerm?: string;
  category?: string;
  status?: string;
  featured?: boolean;
  sortBy?: string;
  page: number;
  limit: number;
}

interface VendorPipelineOptions {
  searchTerm?: string;
  verified?: boolean;
  location?: string;
  sortBy?: string;
  page: number;
  limit: number;
}

/**
 * 🚀 OPTIMIZED PRODUCT SEARCH PIPELINE
 * Implements early-stage filtering and efficient aggregation
 */
export function buildOptimizedProductPipeline(options: PipelineOptions) {
  const pipeline: any[] = [];
  
  // Stage 1: Early filtering (critical for performance)
  const matchStage: any = {};
  
  // Text search with MongoDB's full-text search capabilities
  if (options.searchTerm && options.searchTerm.trim()) {
    matchStage.$text = { 
      $search: options.searchTerm,
      $caseSensitive: false,
      $diacriticSensitive: false
    };
  }
  
  // Category filtering
  if (options.category && options.category !== "All") {
    try {
      matchStage.category = new mongoose.Types.ObjectId(options.category);
    } catch (error) {
      // If category is not a valid ObjectId, treat as string
      matchStage.category = options.category;
    }
  }
  
  // Price range filtering
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    matchStage["subProducts.sizes.price"] = {};
    if (options.minPrice !== undefined) {
      matchStage["subProducts.sizes.price"].$gte = options.minPrice;
    }
    if (options.maxPrice !== undefined) {
      matchStage["subProducts.sizes.price"].$lte = options.maxPrice;
    }
  }
  
  // Stock filtering
  if (options.inStock) {
    matchStage["subProducts.sizes.qty"] = { $gt: 0 };
  }
  
  // Featured products filtering
  if (options.featured) {
    matchStage.featured = true;
  }
  
  // Discount filtering
  if (options.discount) {
    matchStage["subProducts.discount"] = { $gt: 0 };
  }
  
  // Add match stage if we have filters
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }
  
  // Stage 2: Projection (reduce data transfer)
  pipeline.push({
    $project: {
      name: 1,
      description: 1,
      brand: 1,
      slug: 1,
      category: 1,
      rating: 1,
      numReviews: 1,
      featured: 1,
      subProducts: {
        $slice: ["$subProducts", 1] // Only first subProduct for listing performance
      },
      createdAt: 1,
      updatedAt: 1,
      // Include text score for relevance sorting
      score: options.searchTerm ? { $meta: "textScore" } : undefined
    }
  });
  
  // Stage 3: Sorting
  let sortStage: any = {};
  switch (options.sortBy) {
    case "price-low":
      sortStage = { "subProducts.sizes.price": 1 };
      break;
    case "price-high":
      sortStage = { "subProducts.sizes.price": -1 };
      break;
    case "rating":
      sortStage = { rating: -1, numReviews: -1 };
      break;
    case "newest":
      sortStage = { createdAt: -1 };
      break;
    case "popularity":
      sortStage = { numReviews: -1, rating: -1 };
      break;
    case "relevance":
    default:
      if (options.searchTerm && options.searchTerm.trim()) {
        // Sort by text score for search relevance, then by featured status
        sortStage = { 
          score: { $meta: "textScore" }, 
          featured: -1,
          rating: -1
        };
      } else {
        // Default sorting for browsing
        sortStage = { 
          featured: -1, 
          createdAt: -1,
          rating: -1
        };
      }
  }
  pipeline.push({ $sort: sortStage });
  
  // Stage 4: Pagination
  const skip = (options.page - 1) * options.limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: options.limit });
  
  return pipeline;
}

/**
 * 🚀 OPTIMIZED BLOG SEARCH PIPELINE
 */
export function buildOptimizedBlogPipeline(options: BlogPipelineOptions) {
  const pipeline: any[] = [];
  
  // Stage 1: Early filtering
  const matchStage: any = {};
  
  // Status filtering (published by default)
  matchStage.status = options.status || "published";
  
  // Text search
  if (options.searchTerm && options.searchTerm.trim()) {
    matchStage.$text = { 
      $search: options.searchTerm,
      $caseSensitive: false
    };
  }
  
  // Category filtering
  if (options.category && options.category !== "All") {
    matchStage.category = options.category;
  }
  
  // Featured filtering
  if (options.featured) {
    matchStage.featured = true;
  }
  
  pipeline.push({ $match: matchStage });
  
  // Stage 2: Projection
  pipeline.push({
    $project: {
      title: 1,
      slug: 1,
      excerpt: 1,
      featuredImage: 1,
      authorName: 1,
      category: 1,
      tags: 1,
      status: 1,
      featured: 1,
      views: 1,
      likes: 1,
      publishedAt: 1,
      createdAt: 1,
      score: options.searchTerm ? { $meta: "textScore" } : undefined
    }
  });
  
  // Stage 3: Sorting
  let sortStage: any = {};
  switch (options.sortBy) {
    case "newest":
      sortStage = { publishedAt: -1, createdAt: -1 };
      break;
    case "oldest":
      sortStage = { publishedAt: 1, createdAt: 1 };
      break;
    case "popular":
      sortStage = { views: -1, likes: -1 };
      break;
    case "likes":
      sortStage = { likes: -1, views: -1 };
      break;
    case "views":
      sortStage = { views: -1, likes: -1 };
      break;
    case "featured":
      sortStage = { featured: -1, publishedAt: -1 };
      break;
    case "relevance":
    default:
      if (options.searchTerm && options.searchTerm.trim()) {
        sortStage = { 
          score: { $meta: "textScore" }, 
          featured: -1,
          publishedAt: -1 
        };
      } else {
        sortStage = { 
          featured: -1, 
          publishedAt: -1,
          views: -1 
        };
      }
  }
  pipeline.push({ $sort: sortStage });
  
  // Stage 4: Pagination
  const skip = (options.page - 1) * options.limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: options.limit });
  
  return pipeline;
}

/**
 * 🚀 OPTIMIZED VENDOR SEARCH PIPELINE
 */
export function buildOptimizedVendorPipeline(options: VendorPipelineOptions) {
  const pipeline: any[] = [];
  
  // Stage 1: Early filtering
  const matchStage: any = {};
  
  // Text search
  if (options.searchTerm && options.searchTerm.trim()) {
    matchStage.$text = { 
      $search: options.searchTerm,
      $caseSensitive: false
    };
  }
  
  // Verified filtering
  if (options.verified !== undefined) {
    matchStage.verified = options.verified;
  }
  
  // Location filtering
  if (options.location && options.location.trim()) {
    matchStage.address = { 
      $regex: options.location, 
      $options: "i" 
    };
  }
  
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }
  
  // Stage 2: Projection (exclude sensitive data)
  pipeline.push({
    $project: {
      name: 1,
      email: 1,
      description: 1,
      address: 1,
      phoneNumber: 1,
      zipCode: 1,
      verified: 1,
      createdAt: 1,
      commission: 1,
      score: options.searchTerm ? { $meta: "textScore" } : undefined
    }
  });
  
  // Stage 3: Sorting
  let sortStage: any = {};
  switch (options.sortBy) {
    case "newest":
      sortStage = { createdAt: -1 };
      break;
    case "oldest":
      sortStage = { createdAt: 1 };
      break;
    case "name":
      sortStage = { name: 1 };
      break;
    case "verified":
      sortStage = { verified: -1, createdAt: -1 };
      break;
    case "relevance":
    default:
      if (options.searchTerm && options.searchTerm.trim()) {
        sortStage = { 
          score: { $meta: "textScore" }, 
          verified: -1,
          createdAt: -1 
        };
      } else {
        sortStage = { 
          verified: -1, 
          createdAt: -1 
        };
      }
  }
  pipeline.push({ $sort: sortStage });
  
  // Stage 4: Pagination
  const skip = (options.page - 1) * options.limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: options.limit });
  
  return pipeline;
}

/**
 * 🚀 UTILITY FUNCTION TO GET TOTAL COUNT
 * Returns a pipeline for counting total results (without pagination)
 */
export function buildCountPipeline(basePipeline: any[]): any[] {
  // Remove the last two stages (skip and limit) and add count
  const countPipeline = basePipeline.slice(0, -2);
  countPipeline.push({ $count: "total" });
  return countPipeline;
} 