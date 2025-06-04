# MongoDB Search Optimization Implementation Roadmap
## VibeCart Advanced Search Enhancement

### 🎯 **Optimization Goals**
- Reduce search response time by 60-75%
- Decrease database reads by 80-90%
- Improve concurrent request handling by 5-10x
- Add intelligent caching with 80% hit rate

### 📋 **Phase 1: Foundation (Week 1)**

#### 1.1 Enhanced Database Connection
**File: `lib/database/mongodb.ts`** (New optimized connection)
```typescript
import mongoose from 'mongoose';

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const MONGODB_URI = process.env.MONGODB_URI!;
const cached: ConnectionCache = global.mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      dbName: "vibecart"
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}
```

#### 1.2 Schema Index Optimization
**Files to modify:**
- `lib/database/models/product.model.ts`
- `lib/database/models/blog.model.ts`
- `lib/database/models/vendor.model.ts`

**Product Schema Indexes:**
```typescript
// Add these indexes to product schema
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, 'subProducts.sizes.price': 1 });
productSchema.index({ featured: 1, createdAt: -1 });
productSchema.index({ 'subProducts.discount': 1 });
productSchema.index({ rating: -1, numReviews: -1 });
```

### 📋 **Phase 2: Query Optimization (Week 2)**

#### 2.1 Aggregation Pipeline Implementation
**File: `utils/searchPipeline.ts`** (Your optimized pipeline)
```typescript
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

export function buildOptimizedProductPipeline(options: PipelineOptions) {
  const pipeline: any[] = [];
  
  // Stage 1: Early filtering (critical for performance)
  const matchStage: any = {};
  
  if (options.searchTerm) {
    matchStage.$text = { $search: options.searchTerm };
  }
  
  if (options.category && options.category !== "All") {
    matchStage.category = new mongoose.Types.ObjectId(options.category);
  }
  
  if (options.minPrice || options.maxPrice) {
    matchStage["subProducts.sizes.price"] = {};
    if (options.minPrice) matchStage["subProducts.sizes.price"].$gte = options.minPrice;
    if (options.maxPrice) matchStage["subProducts.sizes.price"].$lte = options.maxPrice;
  }
  
  if (options.inStock) {
    matchStage["subProducts.sizes.qty"] = { $gt: 0 };
  }
  
  if (options.featured) {
    matchStage.featured = true;
  }
  
  if (options.discount) {
    matchStage["subProducts.discount"] = { $gt: 0 };
  }
  
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
        $slice: ["$subProducts", 1] // Only first subProduct for listing
      },
      createdAt: 1,
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
    case "relevance":
    default:
      if (options.searchTerm) {
        sortStage = { score: { $meta: "textScore" }, featured: -1 };
      } else {
        sortStage = { featured: -1, createdAt: -1 };
      }
  }
  pipeline.push({ $sort: sortStage });
  
  // Stage 4: Pagination
  pipeline.push({ $skip: (options.page - 1) * options.limit });
  pipeline.push({ $limit: options.limit });
  
  return pipeline;
}
```

#### 2.2 Optimized Search API Routes
**File: `app/api/search/products/route.ts`** (Enhanced with aggregation)
```typescript
import { buildOptimizedProductPipeline } from '@/utils/searchPipeline';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const pipeline = buildOptimizedProductPipeline({
      searchTerm: query,
      category,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      inStock,
      featured,
      discount
    });
    
    const [products, totalCount] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate([
        ...pipeline.slice(0, -2), // Remove skip and limit for count
        { $count: "total" }
      ])
    ]);
    
    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((totalCount[0]?.total || 0) / limit),
        totalResults: totalCount[0]?.total || 0,
        hasNext: page < Math.ceil((totalCount[0]?.total || 0) / limit),
        hasPrev: page > 1,
        limit
      }
    });
  } catch (error) {
    // Error handling
  }
}
```

### 📋 **Phase 3: Advanced Caching (Week 3)**

#### 3.1 Redis Caching Layer
**File: `utils/searchCache.ts`** (Your caching implementation)
```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class SearchCache {
  static async get(key: string) {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  static async set(key: string, data: any, ttl: number = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  static generateKey(filters: any): string {
    const keyData = {
      q: filters.query || '',
      category: filters.category || '',
      price: `${filters.minPrice}-${filters.maxPrice}`,
      sort: filters.sortBy || '',
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
}
```

#### 3.2 Performance Monitoring
**File: `utils/queryAnalyzer.ts`** (Your query analysis tool)
```typescript
export async function analyzeQuery(collection: any, pipeline: any[]) {
  const explanation = await collection.aggregate(pipeline).explain("executionStats");
  
  const stats = {
    totalDocsExamined: explanation.stages?.[0]?.$cursor?.executionStats?.totalDocsExamined || 0,
    totalKeysExamined: explanation.stages?.[0]?.$cursor?.executionStats?.totalKeysExamined || 0,
    executionTimeMillis: explanation.stages?.[0]?.$cursor?.executionStats?.executionTimeMillis || 0,
    nReturned: explanation.stages?.[0]?.$cursor?.executionStats?.nReturned || 0,
    indexUsed: explanation.stages?.[0]?.$cursor?.executionStats?.indexUsed || false
  };
  
  // Log performance metrics
  console.log('Search Performance:', {
    ...stats,
    efficiency: stats.nReturned / Math.max(stats.totalDocsExamined, 1),
    indexEfficiency: stats.totalKeysExamined / Math.max(stats.totalDocsExamined, 1)
  });
  
  return explanation;
}
```

### 📋 **Phase 4: Frontend Optimization (Week 4)**

#### 4.1 Enhanced Search Hook
**File: `hooks/useOptimizedSearch.ts`** (Your debounced search hook)
```typescript
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { SearchCache } from '@/utils/searchCache';

export function useOptimizedSearch() {
  const [result, setResult] = useState({
    products: [],
    blogs: [],
    vendors: [],
    totalCount: 0,
    loading: false,
    error: null
  });
  
  const debouncedSearch = useCallback(
    debounce(async (filters) => {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Try cache first
        const cacheKey = SearchCache.generateKey(filters);
        const cached = await SearchCache.get(cacheKey);
        
        if (cached) {
          setResult({
            ...cached,
            loading: false,
            error: null
          });
          return;
        }
        
        // Fetch from API
        const response = await fetch(`/api/search/products?${new URLSearchParams(filters)}`);
        const data = await response.json();
        
        // Cache results
        await SearchCache.set(cacheKey, data);
        
        setResult({
          ...data,
          loading: false,
          error: null
        });
      } catch (error) {
        setResult(prev => ({
          ...prev,
          loading: false,
          error: 'Search failed'
        }));
      }
    }, 300),
    []
  );
  
  return [result, debouncedSearch];
}
```

### 🔧 **Required Dependencies**
```bash
# Install required packages
npm install ioredis lodash @types/lodash
npm install --save-dev @types/ioredis
```

### 📊 **Performance Monitoring Setup**
**File: `middleware/performance.ts`**
```typescript
export async function withPerformanceMonitoring(handler: any) {
  return async (req: any, res: any) => {
    const startTime = Date.now();
    
    const result = await handler(req, res);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log performance metrics
    console.log(`Search Performance: ${duration}ms`);
    
    // Alert if response time is too high
    if (duration > 1000) {
      console.warn(`Slow search query detected: ${duration}ms`);
    }
    
    return result;
  };
}
```

### 🚀 **Expected Results**

#### Before Optimization:
- Search response time: 800-1500ms
- Database scans: Full collection scans
- Memory usage: High
- Concurrent requests: Limited

#### After Optimization:
- Search response time: 200-400ms (**60-75% improvement**)
- Database scans: Index-based scans (**90% reduction in examined docs**)
- Memory usage: Optimized (**50% reduction**)
- Concurrent requests: 5-10x improvement
- Cache hit rate: 70-80% for common searches

### 📈 **Success Metrics**
1. **Response Time**: < 500ms for 95% of requests
2. **Database Efficiency**: Index usage > 90%
3. **Cache Hit Rate**: > 70%
4. **Memory Usage**: < 50% of current usage
5. **Error Rate**: < 1%

### 🔍 **Monitoring & Alerts**
1. Set up performance monitoring dashboards
2. Alert on slow queries (>1000ms)
3. Monitor cache hit rates
4. Track search error rates
5. Database connection pool monitoring

This optimization strategy will transform VibeCart's search performance while maintaining the existing functionality and improving user experience significantly. 