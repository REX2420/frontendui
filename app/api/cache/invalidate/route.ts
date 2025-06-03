import { NextRequest, NextResponse } from 'next/server';
import { 
  invalidateHomePageCache, 
  invalidateProductCache, 
  invalidateBannerCache,
  invalidateBlogCache,
  invalidateFooterCache,
  invalidateCategoryCache,
  invalidateSubcategoryCache,
  invalidateCategoryStructureCache,
  invalidateAllCache,
  invalidateCacheByTag,
  invalidateCacheByPath
} from '@/lib/cache-utils';

/**
 * API Route for Cache Invalidation
 * POST /api/cache/invalidate
 * 
 * Body options:
 * - { type: "home" } - Invalidate home page cache
 * - { type: "products" } - Invalidate product cache
 * - { type: "banners" } - Invalidate banner cache
 * - { type: "blogs" } - Invalidate blog cache
 * - { type: "footer" } - Invalidate footer cache
 * - { type: "categories" } - Invalidate category cache
 * - { type: "subcategories" } - Invalidate subcategory cache
 * - { type: "category-structure" } - Invalidate both category and subcategory cache
 * - { type: "all" } - Invalidate all cache
 * - { type: "tag", tag: "specific_tag" } - Invalidate specific tag
 * - { type: "path", path: "/specific/path" } - Invalidate specific path
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, tag, path } = body;

    let result;

    switch (type) {
      case 'home':
        result = await invalidateHomePageCache();
        break;
      
      case 'products':
        result = await invalidateProductCache();
        break;
      
      case 'banners':
        result = await invalidateBannerCache();
        break;
      
      case 'blogs':
        result = await invalidateBlogCache();
        break;
      
      case 'footer':
        result = await invalidateFooterCache();
        break;
      
      case 'categories':
        result = await invalidateCategoryCache();
        break;
      
      case 'subcategories':
        result = await invalidateSubcategoryCache();
        break;
      
      case 'category-structure':
        result = await invalidateCategoryStructureCache();
        break;
      
      case 'all':
        result = await invalidateAllCache();
        break;
      
      case 'tag':
        if (!tag) {
          return NextResponse.json(
            { success: false, error: 'Tag is required for tag invalidation' },
            { status: 400 }
          );
        }
        result = await invalidateCacheByTag(tag);
        break;
      
      case 'path':
        if (!path) {
          return NextResponse.json(
            { success: false, error: 'Path is required for path invalidation' },
            { status: 400 }
          );
        }
        result = await invalidateCacheByPath(path);
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid invalidation type. Use: home, products, banners, blogs, footer, categories, subcategories, category-structure, all, tag, or path' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Cache invalidation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET method to show available invalidation options
 */
export async function GET() {
  return NextResponse.json({
    message: 'Cache Invalidation API',
    availableTypes: [
      { type: 'home', description: 'Invalidate home page cache (12 hours)' },
      { type: 'products', description: 'Invalidate product cache (12 hours)' },
      { type: 'banners', description: 'Invalidate banner cache (12 hours)' },
      { type: 'blogs', description: 'Invalidate blog cache (12 hours)' },
      { type: 'footer', description: 'Invalidate footer cache (weekly)' },
      { type: 'categories', description: 'Invalidate category cache (weekly)' },
      { type: 'subcategories', description: 'Invalidate subcategory cache (weekly)' },
      { type: 'category-structure', description: 'Invalidate both category and subcategory cache (weekly)' },
      { type: 'all', description: 'Invalidate all cache (use sparingly)' },
      { type: 'tag', description: 'Invalidate specific cache tag', requires: 'tag parameter' },
      { type: 'path', description: 'Invalidate specific path', requires: 'path parameter' }
    ],
    examples: [
      { method: 'POST', body: { type: 'home' } },
      { method: 'POST', body: { type: 'products' } },
      { method: 'POST', body: { type: 'blogs' } },
      { method: 'POST', body: { type: 'footer' } },
      { method: 'POST', body: { type: 'categories' } },
      { method: 'POST', body: { type: 'subcategories' } },
      { method: 'POST', body: { type: 'category-structure' } },
      { method: 'POST', body: { type: 'tag', tag: 'featured_products' } },
      { method: 'POST', body: { type: 'path', path: '/' } }
    ]
  });
} 