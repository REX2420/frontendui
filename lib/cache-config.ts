/**
 * Cache Configuration for VibeCart
 * Centralized cache settings for consistent cache management
 */

// Cache duration constants (in seconds)
export const CACHE_DURATIONS = {
  // Short-term cache (5 minutes)
  SHORT: 300,
  
  // Medium-term cache (30 minutes)
  MEDIUM: 1800,
  
  // Long-term cache (12 hours) - Used for home page sections
  LONG: 43200,
  
  // Very long-term cache (24 hours)
  VERY_LONG: 86400,
  
  // Weekly cache (7 days)
  WEEKLY: 604800,
} as const;

// Cache tags for better invalidation control
export const CACHE_TAGS = {
  // Home page related
  HOME_BANNERS: 'home_banners',
  HOME_PRODUCTS: 'home_products',
  HOME_BLOGS: 'home_blogs',
  
  // Product related
  PRODUCTS: 'products',
  FEATURED_PRODUCTS: 'featured_products',
  TOP_SELLING_PRODUCTS: 'top_selling_products',
  NEW_ARRIVAL_PRODUCTS: 'new_arrival_products',
  
  // Banner related
  WEBSITE_BANNERS: 'website_banners',
  APP_BANNERS: 'app_banners',
  
  // Blog related
  BLOGS: 'blogs',
  PUBLISHED_BLOGS_HOME: 'published_blogs_home',
  FEATURED_BLOGS_HOME: 'featured_blogs_home',
  BLOG_CATEGORIES: 'blog_categories',
  BLOGS_BY_CATEGORY: 'blogs_by_category',
  
  // Footer related
  FOOTER_DATA: 'footer_data',
  FOOTER_NAVIGATION: 'footer_navigation',
  FOOTER_SOCIAL_MEDIA: 'footer_social_media',
  
  // Category related (weekly cache)
  CATEGORIES: 'categories',
  ALL_CATEGORIES: 'all_categories',
  CATEGORIES_WITH_COUNTS: 'categories_with_counts',
  FEATURED_CATEGORIES: 'featured_categories',
  CATEGORY_WITH_SUBCATEGORIES: 'category_with_subcategories',
  
  // Subcategory related (weekly cache)
  SUBCATEGORIES: 'subcategories',
  PARENT_SUBCATEGORIES: 'parent_subCategories',
  SUBCATEGORIES_WITH_COUNTS: 'subcategories_with_counts',
  SUBCATEGORIES_NAVIGATION: 'subcategories_navigation',
  POPULAR_SUBCATEGORIES: 'popular_subcategories',
  
  // User related
  USER_DATA: 'user_data',
} as const;

// Cache configuration presets
export const CACHE_CONFIGS = {
  // Home page sections - 12 hour cache
  HOME_SECTIONS: {
    revalidate: CACHE_DURATIONS.LONG,
    tags: [CACHE_TAGS.HOME_PRODUCTS, CACHE_TAGS.HOME_BANNERS],
  },
  
  // Product listings - 12 hour cache
  PRODUCT_LISTINGS: {
    revalidate: CACHE_DURATIONS.LONG,
    tags: [CACHE_TAGS.PRODUCTS],
  },
  
  // Static content - 24 hour cache
  STATIC_CONTENT: {
    revalidate: CACHE_DURATIONS.VERY_LONG,
  },
  
  // Dynamic content - 30 minute cache
  DYNAMIC_CONTENT: {
    revalidate: CACHE_DURATIONS.MEDIUM,
  },
} as const;

// Helper function to create cache keys
export function createCacheKey(prefix: string, ...args: (string | number)[]): string {
  return [prefix, ...args].join('-');
}

// Helper function to invalidate related caches
export function getRelatedCacheTags(section: 'home' | 'products' | 'banners' | 'blogs' | 'footer' | 'categories' | 'subcategories'): string[] {
  switch (section) {
    case 'home':
      return [CACHE_TAGS.HOME_BANNERS, CACHE_TAGS.HOME_PRODUCTS, CACHE_TAGS.HOME_BLOGS, CACHE_TAGS.FEATURED_PRODUCTS];
    case 'products':
      return [CACHE_TAGS.PRODUCTS, CACHE_TAGS.FEATURED_PRODUCTS, CACHE_TAGS.TOP_SELLING_PRODUCTS, CACHE_TAGS.NEW_ARRIVAL_PRODUCTS];
    case 'banners':
      return [CACHE_TAGS.WEBSITE_BANNERS, CACHE_TAGS.APP_BANNERS, CACHE_TAGS.HOME_BANNERS];
    case 'blogs':
      return [CACHE_TAGS.BLOGS, CACHE_TAGS.PUBLISHED_BLOGS_HOME, CACHE_TAGS.FEATURED_BLOGS_HOME, CACHE_TAGS.BLOG_CATEGORIES, CACHE_TAGS.BLOGS_BY_CATEGORY, CACHE_TAGS.HOME_BLOGS];
    case 'footer':
      return [CACHE_TAGS.FOOTER_DATA, CACHE_TAGS.FOOTER_NAVIGATION, CACHE_TAGS.FOOTER_SOCIAL_MEDIA];
    case 'categories':
      return [CACHE_TAGS.CATEGORIES, CACHE_TAGS.ALL_CATEGORIES, CACHE_TAGS.CATEGORIES_WITH_COUNTS, CACHE_TAGS.FEATURED_CATEGORIES, CACHE_TAGS.CATEGORY_WITH_SUBCATEGORIES];
    case 'subcategories':
      return [CACHE_TAGS.SUBCATEGORIES, CACHE_TAGS.PARENT_SUBCATEGORIES, CACHE_TAGS.SUBCATEGORIES_WITH_COUNTS, CACHE_TAGS.SUBCATEGORIES_NAVIGATION, CACHE_TAGS.POPULAR_SUBCATEGORIES];
    default:
      return [];
  }
} 