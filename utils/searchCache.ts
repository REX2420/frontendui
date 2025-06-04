// Lazy import for ioredis to avoid Next.js tree-shaking issues
let Redis: any = null;
let redis: any = null;

async function initRedis() {
  if (redis) return redis;
  
  try {
    // Lazy import ioredis only when needed
    if (!Redis) {
      const ioredis = await import('ioredis');
      Redis = ioredis.Redis;
    }
    
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redis.on('error', (error: any) => {
      console.warn('Redis connection error:', error.message);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully for search caching');
    });

    return redis;
  } catch (error) {
    console.warn('Redis not available - search caching will be disabled:', error);
    return null;
  }
}

/**
 * Get cached search results
 */
export async function getCachedData(key: string): Promise<any | null> {
  const client = await initRedis();
  if (!client) return null;
  
  try {
    const cached = await client.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log(`🚀 Cache HIT for key: ${key.substring(0, 50)}...`);
      return parsed;
    }
    console.log(`⚡ Cache MISS for key: ${key.substring(0, 50)}...`);
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached search results with TTL
 */
export async function setCachedData(key: string, data: any, ttl: number = 300): Promise<void> {
  const client = await initRedis();
  if (!client) return;
  
  try {
    await client.setex(key, ttl, JSON.stringify(data));
    console.log(`💾 Cache SET for key: ${key.substring(0, 50)}... (TTL: ${ttl}s)`);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cached results (for cache invalidation)
 */
export async function deleteCachedData(key: string): Promise<void> {
  const client = await initRedis();
  if (!client) return;
  
  try {
    await client.del(key);
    console.log(`🗑️ Cache DELETED for key: ${key.substring(0, 50)}...`);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete multiple cached results by pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  const client = await initRedis();
  if (!client) return;
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      console.log(`🗑️ Cache DELETED ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
}

/**
 * Generate cache key for product search
 */
export function generateProductCacheKey(filters: any): string {
  const keyData = {
    type: 'products',
    q: filters.query || '',
    category: filters.category || '',
    price: `${filters.minPrice || 0}-${filters.maxPrice || 999999}`,
    sort: filters.sortBy || 'relevance',
    filters: {
      inStock: filters.inStock || false,
      featured: filters.featured || false,
      discount: filters.discount || false
    },
    page: filters.page || 1,
    limit: filters.limit || 20
  };
  return `search:products:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
}

/**
 * Generate cache key for blog search
 */
export function generateBlogCacheKey(filters: any): string {
  const keyData = {
    type: 'blogs',
    q: filters.query || '',
    category: filters.category || '',
    status: filters.status || 'published',
    sort: filters.sortBy || 'relevance',
    featured: filters.featured || false,
    page: filters.page || 1,
    limit: filters.limit || 20
  };
  return `search:blogs:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
}

/**
 * Generate cache key for vendor search
 */
export function generateVendorCacheKey(filters: any): string {
  const keyData = {
    type: 'vendors',
    q: filters.query || '',
    verified: filters.verified,
    location: filters.location || '',
    sort: filters.sortBy || 'relevance',
    page: filters.page || 1,
    limit: filters.limit || 20
  };
  return `search:vendors:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
}

/**
 * Invalidate all search cache
 */
export async function invalidateAllCache(): Promise<void> {
  await Promise.all([
    deleteCachedPattern('search:products:*'),
    deleteCachedPattern('search:blogs:*'),
    deleteCachedPattern('search:vendors:*')
  ]);
}

/**
 * Invalidate product-related cache
 */
export async function invalidateProductCache(): Promise<void> {
  await deleteCachedPattern('search:products:*');
}

/**
 * Invalidate blog-related cache
 */
export async function invalidateBlogCache(): Promise<void> {
  await deleteCachedPattern('search:blogs:*');
}

/**
 * Invalidate vendor-related cache
 */
export async function invalidateVendorCache(): Promise<void> {
  await deleteCachedPattern('search:vendors:*');
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<any> {
  const client = await initRedis();
  if (!client) return { available: false };
  
  try {
    const info = await client.info('memory');
    const keyCount = await client.dbsize();
    
    return {
      available: true,
      keyCount,
      memoryInfo: info,
      connected: client.status === 'ready'
    };
  } catch (error: any) {
    console.error('Error getting cache stats:', error);
    return { available: false, error: error.message };
  }
}

// Legacy class-based interface for backward compatibility
export class SearchCache {
  static get = getCachedData;
  static set = setCachedData;
  static del = deleteCachedData;
  static delPattern = deleteCachedPattern;
  static generateProductKey = generateProductCacheKey;
  static generateBlogKey = generateBlogCacheKey;
  static generateVendorKey = generateVendorCacheKey;
  static invalidateAll = invalidateAllCache;
  static invalidateProducts = invalidateProductCache;
  static invalidateBlogs = invalidateBlogCache;
  static invalidateVendors = invalidateVendorCache;
  static getCacheStats = getCacheStats;
} 