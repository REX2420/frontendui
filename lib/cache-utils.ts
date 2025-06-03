/**
 * Cache Utilities for VibeCart
 * Helper functions for cache management and invalidation
 */

import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS, getRelatedCacheTags } from './cache-config';

/**
 * Invalidate home page cache
 * Call this when home page data needs to be refreshed
 */
export async function invalidateHomePageCache() {
  try {
    // Revalidate the home page path
    revalidatePath('/');
    
    // Revalidate related tags
    const homeTags = getRelatedCacheTags('home');
    homeTags.forEach(tag => revalidateTag(tag));
    
    console.log('Home page cache invalidated successfully');
    return { success: true, message: 'Home page cache invalidated' };
  } catch (error) {
    console.error('Error invalidating home page cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate product-related cache
 * Call this when products are updated
 */
export async function invalidateProductCache() {
  try {
    // Revalidate product-related tags
    const productTags = getRelatedCacheTags('products');
    productTags.forEach(tag => revalidateTag(tag));
    
    // Also revalidate home page since it shows products
    revalidatePath('/');
    
    console.log('Product cache invalidated successfully');
    return { success: true, message: 'Product cache invalidated' };
  } catch (error) {
    console.error('Error invalidating product cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate banner cache
 * Call this when banners are updated
 */
export async function invalidateBannerCache() {
  try {
    // Revalidate banner-related tags
    const bannerTags = getRelatedCacheTags('banners');
    bannerTags.forEach(tag => revalidateTag(tag));
    
    // Also revalidate home page since it shows banners
    revalidatePath('/');
    
    console.log('Banner cache invalidated successfully');
    return { success: true, message: 'Banner cache invalidated' };
  } catch (error) {
    console.error('Error invalidating banner cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate blog cache
 * Call this when blogs are updated
 */
export async function invalidateBlogCache() {
  try {
    // Revalidate blog-related tags
    const blogTags = getRelatedCacheTags('blogs');
    blogTags.forEach(tag => revalidateTag(tag));
    
    // Also revalidate home page since it shows blogs
    revalidatePath('/');
    revalidatePath('/blog');
    
    console.log('Blog cache invalidated successfully');
    return { success: true, message: 'Blog cache invalidated' };
  } catch (error) {
    console.error('Error invalidating blog cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate footer cache
 * Call this when footer data is updated
 */
export async function invalidateFooterCache() {
  try {
    // Revalidate footer-related tags
    const footerTags = getRelatedCacheTags('footer');
    footerTags.forEach(tag => revalidateTag(tag));
    
    // Revalidate all pages since footer appears on all pages
    revalidatePath('/', 'layout');
    
    console.log('Footer cache invalidated successfully');
    return { success: true, message: 'Footer cache invalidated' };
  } catch (error) {
    console.error('Error invalidating footer cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate category cache
 * Call this when categories are updated
 */
export async function invalidateCategoryCache() {
  try {
    // Revalidate category-related tags
    const categoryTags = getRelatedCacheTags('categories');
    categoryTags.forEach(tag => revalidateTag(tag));
    
    // Also revalidate home page and shop pages since they show categories
    revalidatePath('/');
    revalidatePath('/categories');
    revalidatePath('/shop');
    
    console.log('Category cache invalidated successfully');
    return { success: true, message: 'Category cache invalidated' };
  } catch (error) {
    console.error('Error invalidating category cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate subcategory cache
 * Call this when subcategories are updated
 */
export async function invalidateSubcategoryCache() {
  try {
    // Revalidate subcategory-related tags
    const subcategoryTags = getRelatedCacheTags('subcategories');
    subcategoryTags.forEach(tag => revalidateTag(tag));
    
    // Also revalidate category cache since subcategories affect category counts
    const categoryTags = getRelatedCacheTags('categories');
    categoryTags.forEach(tag => revalidateTag(tag));
    
    // Revalidate affected pages
    revalidatePath('/');
    revalidatePath('/categories');
    revalidatePath('/shop');
    
    console.log('Subcategory cache invalidated successfully');
    return { success: true, message: 'Subcategory cache invalidated' };
  } catch (error) {
    console.error('Error invalidating subcategory cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate both category and subcategory cache
 * Call this when category structure changes significantly
 */
export async function invalidateCategoryStructureCache() {
  try {
    // Revalidate both category and subcategory tags
    const categoryTags = getRelatedCacheTags('categories');
    const subcategoryTags = getRelatedCacheTags('subcategories');
    
    [...categoryTags, ...subcategoryTags].forEach(tag => revalidateTag(tag));
    
    // Revalidate all affected pages
    revalidatePath('/');
    revalidatePath('/categories');
    revalidatePath('/shop');
    
    console.log('Category structure cache invalidated successfully');
    return { success: true, message: 'Category structure cache invalidated' };
  } catch (error) {
    console.error('Error invalidating category structure cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate all caches
 * Use sparingly - only when necessary
 */
export async function invalidateAllCache() {
  try {
    // Revalidate all cache tags
    Object.values(CACHE_TAGS).forEach(tag => revalidateTag(tag));
    
    // Revalidate all main paths
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/categories');
    revalidatePath('/blog');
    
    console.log('All cache invalidated successfully');
    return { success: true, message: 'All cache invalidated' };
  } catch (error) {
    console.error('Error invalidating all cache:', error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate specific cache by tag
 */
export async function invalidateCacheByTag(tag: string) {
  try {
    revalidateTag(tag);
    console.log(`Cache invalidated for tag: ${tag}`);
    return { success: true, message: `Cache invalidated for tag: ${tag}` };
  } catch (error) {
    console.error(`Error invalidating cache for tag ${tag}:`, error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
}

/**
 * Invalidate cache by path
 */
export async function invalidateCacheByPath(path: string) {
  try {
    revalidatePath(path);
    console.log(`Cache invalidated for path: ${path}`);
    return { success: true, message: `Cache invalidated for path: ${path}` };
  } catch (error) {
    console.error(`Error invalidating cache for path ${path}:`, error);
    return { success: false, error: 'Failed to invalidate cache' };
  }
} 