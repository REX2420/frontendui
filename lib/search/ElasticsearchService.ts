import { Client } from '@elastic/elasticsearch';
import { SearchService, SearchResult, SearchFilters } from './SearchService';

export class ElasticsearchService extends SearchService {
  private client: Client;
  private indexPrefix: string;

  constructor() {
    super();
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
    this.indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'vibecart_';
  }

  async searchProducts(filters: SearchFilters): Promise<SearchResult> {
    try {
      const {
        searchTerm = '',
        category = '',
        minPrice = 0,
        maxPrice = 999999,
        sortBy = 'relevance',
        inStock = false,
        featured = false,
        discount = false,
        page = 1,
        limit = 20
      } = filters;

      // Build Elasticsearch query
      const query: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      // Text search with enhanced keyword matching
      if (searchTerm.trim()) {
        query.bool.must.push({
          multi_match: {
            query: searchTerm,
            fields: [
              'name^3',           // Boost product name
              'name.keyword^4',   // Exact name matches get highest boost
              'brand^2',          // Brand gets medium boost  
              'description',      // Description gets base relevance
              'longDescription^0.5', // Long description gets lower boost
              'category',         // Category matching
              'subProducts.colors.color', // Color matching
              'tags^1.5'          // Tags get slight boost
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',   // Handle typos
            prefix_length: 2,    // Prevent too many fuzzy matches
            operator: 'and'      // All terms should match
          }
        });
      } else {
        // If no search term, match all
        query.bool.must.push({ match_all: {} });
      }

      // Category filter
      if (category && category !== 'All') {
        query.bool.filter.push({
          term: { 'category.keyword': category }
        });
      }

      // Price range filter
      if (maxPrice !== 999999 || minPrice > 0) {
        query.bool.filter.push({
          range: {
            'subProducts.sizes.price': {
              gte: minPrice,
              lte: maxPrice === 999999 ? 10000 : maxPrice
            }
          }
        });
      }

      // Stock filter
      if (inStock) {
        query.bool.filter.push({
          range: { 'subProducts.sizes.qty': { gt: 0 } }
        });
      }

      // Featured filter
      if (featured) {
        query.bool.filter.push({
          term: { featured: true }
        });
      }

      // Discount filter
      if (discount) {
        query.bool.filter.push({
          range: { 'subProducts.discount': { gt: 0 } }
        });
      }

      // Sorting
      const sort: any[] = [];
      switch (sortBy) {
        case 'relevance':
          if (searchTerm.trim()) {
            sort.push({ _score: { order: 'desc' } });
          }
          sort.push({ featured: { order: 'desc' } });
          sort.push({ createdAt: { order: 'desc' } });
          break;
        case 'price_low':
          sort.push({ 'subProducts.sizes.price': { order: 'asc' } });
          break;
        case 'price_high':
          sort.push({ 'subProducts.sizes.price': { order: 'desc' } });
          break;
        case 'newest':
          sort.push({ createdAt: { order: 'desc' } });
          break;
        case 'rating':
          sort.push({ rating: { order: 'desc' } });
          break;
        case 'popular':
          sort.push({ numReviews: { order: 'desc' } });
          break;
        default:
          sort.push({ _score: { order: 'desc' } });
      }

      // Execute search
      const response = await this.client.search({
        index: `${this.indexPrefix}products`,
        body: {
          query,
          sort,
          from: (page - 1) * limit,
          size: limit,
          highlight: {
            fields: {
              name: {},
              description: {},
              brand: {}
            }
          }
        }
      });

      const hits = response.body.hits;
      const totalResults = typeof hits.total === 'number' ? hits.total : hits.total?.value || 0;
      const totalPages = Math.ceil(totalResults / limit);

      // Transform results
      const products = hits.hits.map((hit: any) => ({
        ...hit._source,
        _score: hit._score,
        _highlight: hit.highlight
      }));

      return {
        success: true,
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit
        },
        searchInfo: {
          query: searchTerm,
          category,
          priceRange: [minPrice, maxPrice === 999999 ? 1000 : maxPrice],
          sortBy,
          filters: { inStock, featured, discount }
        },
        message: `Found ${totalResults} products`,
        cached: false,
        engine: 'elasticsearch'
      };

    } catch (error: any) {
      throw new Error(`Elasticsearch search failed: ${error.message}`);
    }
  }

  async searchBlogs(filters: any): Promise<SearchResult> {
    // Implementation for blog search
    throw new Error('Blog search not implemented yet');
  }

  async searchVendors(filters: any): Promise<SearchResult> {
    // Implementation for vendor search  
    throw new Error('Vendor search not implemented yet');
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
} 