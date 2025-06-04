import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Cache invalidation utility for VibecCart
 * Handles invalidating Next.js cache when data is updated
 */
export class CacheInvalidation {
  
  /**
   * Invalidate all product-related caches
   * Call this when any product is created, updated, or deleted
   */
  static async invalidateProducts() {
    try {
      console.log('🗑️ Invalidating all product caches...');
      
      // Invalidate all product-related tags
      revalidateTag('products');
      revalidateTag('homepage');
      revalidateTag('top-selling');
      revalidateTag('new-arrivals');
      revalidateTag('featured');
      revalidateTag('categories');
      
      // Also invalidate specific paths that show products
      revalidatePath('/');
      revalidatePath('/shop');
      
      console.log('✅ Product caches invalidated successfully');
    } catch (error) {
      console.error('❌ Error invalidating product caches:', error);
    }
  }

  /**
   * Invalidate specific product cache
   * Call this when a specific product is updated
   */
  static async invalidateProduct(productId: string, slug?: string) {
    try {
      console.log(`🗑️ Invalidating cache for product ${productId}...`);
      
      // Invalidate the specific product
      revalidateTag('product');
      
      // Also invalidate general product listings since this product might appear there
      revalidateTag('products');
      revalidateTag('homepage');
      
      // Invalidate the specific product page if slug is provided
      if (slug) {
        revalidatePath(`/product/${slug}`);
      }
      
      console.log(`✅ Product ${productId} cache invalidated successfully`);
    } catch (error) {
      console.error(`❌ Error invalidating cache for product ${productId}:`, error);
    }
  }

  /**
   * Invalidate category-related caches
   * Call this when categories are updated
   */
  static async invalidateCategories() {
    try {
      console.log('🗑️ Invalidating category caches...');
      
      revalidateTag('categories');
      revalidatePath('/categories');
      revalidatePath('/shop');
      
      console.log('✅ Category caches invalidated successfully');
    } catch (error) {
      console.error('❌ Error invalidating category caches:', error);
    }
  }

  /**
   * Invalidate homepage caches
   * Call this when featured products or homepage content changes
   */
  static async invalidateHomepage() {
    try {
      console.log('🗑️ Invalidating homepage caches...');
      
      revalidateTag('homepage');
      revalidateTag('featured');
      revalidateTag('top-selling');
      revalidateTag('new-arrivals');
      revalidatePath('/');
      
      console.log('✅ Homepage caches invalidated successfully');
    } catch (error) {
      console.error('❌ Error invalidating homepage caches:', error);
    }
  }

  /**
   * Nuclear option: Invalidate all caches
   * Use this sparingly, only when you need to clear everything
   */
  static async invalidateAll() {
    try {
      console.log('🗑️ Invalidating ALL caches (nuclear option)...');
      
      // Invalidate all possible tags
      const allTags = [
        'products', 
        'product', 
        'homepage', 
        'categories', 
        'top-selling', 
        'new-arrivals', 
        'featured'
      ];
      
      allTags.forEach(tag => revalidateTag(tag));
      
      // Invalidate key paths
      const keyPaths = ['/', '/shop', '/categories'];
      keyPaths.forEach(path => revalidatePath(path));
      
      console.log('✅ All caches invalidated successfully');
    } catch (error) {
      console.error('❌ Error invalidating all caches:', error);
    }
  }
} 