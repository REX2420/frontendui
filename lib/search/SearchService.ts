export interface SearchResult {
  success: boolean;
  products: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
  searchInfo: any;
  message: string;
  cached: boolean;
  engine: 'mongodb' | 'elasticsearch';
}

export interface SearchFilters {
  searchTerm?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  inStock?: boolean;
  featured?: boolean;
  discount?: boolean;
  page?: number;
  limit?: number;
}

export abstract class SearchService {
  abstract searchProducts(filters: SearchFilters): Promise<SearchResult>;
  abstract searchBlogs(filters: any): Promise<SearchResult>;
  abstract searchVendors(filters: any): Promise<SearchResult>;
} 