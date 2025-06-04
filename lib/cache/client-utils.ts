/**
 * Client-side cache invalidation utilities
 * Call these from React components after product updates
 */

export class ClientCacheUtils {
  
  /**
   * Invalidate all product caches
   * Call this after creating, updating, or deleting any product
   */
  static async invalidateProducts(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'products'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Product caches invalidated successfully');
        return { success: true, message: 'Caches updated successfully' };
      } else {
        console.warn('⚠️ Cache invalidation failed:', result.message);
        return { success: false, message: result.message || 'Cache invalidation failed' };
      }
    } catch (error) {
      console.error('❌ Error calling cache invalidation:', error);
      return { success: false, message: 'Failed to update caches' };
    }
  }

  /**
   * Invalidate specific product cache
   * Call this after updating a specific product
   */
  static async invalidateProduct(productId: string, slug?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'product',
          productId,
          slug
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Product ${productId} cache invalidated successfully`);
        return { success: true, message: 'Product cache updated successfully' };
      } else {
        console.warn('⚠️ Product cache invalidation failed:', result.message);
        return { success: false, message: result.message || 'Cache invalidation failed' };
      }
    } catch (error) {
      console.error('❌ Error calling product cache invalidation:', error);
      return { success: false, message: 'Failed to update product cache' };
    }
  }

  /**
   * Invalidate homepage caches
   * Call this when featured products change
   */
  static async invalidateHomepage(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'homepage'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Homepage caches invalidated successfully');
        return { success: true, message: 'Homepage caches updated successfully' };
      } else {
        console.warn('⚠️ Homepage cache invalidation failed:', result.message);
        return { success: false, message: result.message || 'Cache invalidation failed' };
      }
    } catch (error) {
      console.error('❌ Error calling homepage cache invalidation:', error);
      return { success: false, message: 'Failed to update homepage caches' };
    }
  }

  /**
   * Invalidate category caches
   * Call this when categories change
   */
  static async invalidateCategories(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'categories'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Category caches invalidated successfully');
        return { success: true, message: 'Category caches updated successfully' };
      } else {
        console.warn('⚠️ Category cache invalidation failed:', result.message);
        return { success: false, message: result.message || 'Cache invalidation failed' };
      }
    } catch (error) {
      console.error('❌ Error calling category cache invalidation:', error);
      return { success: false, message: 'Failed to update category caches' };
    }
  }
} 