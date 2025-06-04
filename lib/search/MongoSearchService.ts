import { SearchService, SearchResult, SearchFilters } from './SearchService';
import { dbConnect } from '@/lib/database/mongodb';
import Product from '@/lib/database/models/product.model';
import { buildOptimizedProductPipeline, buildCountPipeline } from '@/utils/searchPipeline';
import { withPerformanceMonitoring } from '@/utils/queryAnalyzer';

export class MongoSearchService extends SearchService {
  async searchProducts(filters: SearchFilters): Promise<SearchResult> {
    await dbConnect();

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const pipeline = buildOptimizedProductPipeline({
      searchTerm: filters.searchTerm,
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      page: page,
      limit: limit,
      sortBy: filters.sortBy,
      inStock: filters.inStock,
      featured: filters.featured,
      discount: filters.discount
    });

    const countPipeline = buildCountPipeline(pipeline);

    const [products, totalCountResult] = await Promise.all([
      withPerformanceMonitoring(
        () => Product.aggregate(pipeline),
        `Product Search - Page ${page}`
      ),
      withPerformanceMonitoring(
        () => Product.aggregate(countPipeline),
        `Product Count - ${filters.searchTerm || 'Browse'}`
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

    return {
      success: true,
      products: transformedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalResults: totalProducts,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limit
      },
      searchInfo: {
        query: filters.searchTerm,
        category: filters.category,
        priceRange: [filters.minPrice || 0, filters.maxPrice === 999999 ? 1000 : filters.maxPrice],
        sortBy: filters.sortBy,
        filters: {
          inStock: filters.inStock,
          featured: filters.featured,
          discount: filters.discount
        }
      },
      message: `Found ${totalProducts} products`,
      cached: false,
      engine: 'mongodb'
    };
  }

  async searchBlogs(filters: any): Promise<SearchResult> {
    // Your existing blog search logic would go here
    throw new Error('Blog search not implemented yet');
  }

  async searchVendors(filters: any): Promise<SearchResult> {
    // Your existing vendor search logic would go here
    throw new Error('Vendor search not implemented yet');
  }
} 