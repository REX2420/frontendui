"use server";

import { RedisCartService } from './redis-cart.service';
import { BrowserCartService } from './browser-cart.service';
import { 
  Cart, 
  CartItem, 
  CartUpdatePayload, 
  CartRetrievalResult, 
  CartUpdateResult, 
  StorageTier, 
  CartOperation,
  DEFAULT_CART_CONFIG 
} from './types';
import { isRedisAvailable } from '@/lib/redis/connect';

export class CartManagerService {
  private static instance: CartManagerService;
  private redisService: RedisCartService;
  private browserService: BrowserCartService;

  private constructor() {
    this.redisService = RedisCartService.getInstance();
    this.browserService = BrowserCartService.getInstance();
  }

  static getInstance(): CartManagerService {
    if (!CartManagerService.instance) {
      CartManagerService.instance = new CartManagerService();
    }
    return CartManagerService.instance;
  }

  /**
   * Cart Retrieval Flow (Redis + localStorage only):
   * 1. Check Redis first
   * 2. Fall back to localStorage if not found
   * 3. Merge with any localStorage data
   */
  async getCart(userId?: string, sessionId?: string): Promise<CartRetrievalResult> {
    try {
      const identifier = userId || sessionId;
      
      if (!identifier) {
        return { cart: null, source: 'redis', success: false, message: 'No identifier provided' };
      }

      // Step 1: Check Redis first (if available)
      const redisAvailable = await isRedisAvailable();
      
      if (redisAvailable && userId) {
        const redisResult = await this.redisService.getCart(userId, sessionId);
        
        if (redisResult.success && redisResult.cart) {
          console.log(`🔥 Cart retrieved from Redis for ${identifier}`);
          return redisResult;
        }
      }

      // Step 2: Check localStorage (guest users or fallback)
      if (typeof window !== 'undefined') {
        const browserResult = await this.browserService.getCart(userId, sessionId);
        
        if (browserResult.success && browserResult.cart) {
          console.log(`💾 Cart retrieved from localStorage for ${identifier}`);
          
          // If user is registered, sync to Redis
          if (userId && browserResult.cart.items.length > 0 && redisAvailable) {
            await this.syncBrowserCartToRedis(browserResult.cart, userId);
          }
          
          return { ...browserResult, source: 'localStorage' };
        }
      }

      // No cart found in any tier
      return { cart: null, source: 'redis', success: true, message: 'No cart found in any storage tier' };
      
    } catch (error) {
      console.error('CartManager getCart error:', error);
      return { cart: null, source: 'redis', success: false, message: 'Failed to retrieve cart' };
    }
  }

  /**
   * Cart Update Flow (Redis + localStorage only):
   * 1. Write to Redis immediately (if logged in)
   * 2. Write to localStorage (backup/guest users)
   * 3. Return success to user
   */
  async updateCart(payload: CartUpdatePayload, operation: CartOperation = CartOperation.SYNC_CART): Promise<CartUpdateResult> {
    try {
      const identifier = payload.userId || payload.sessionId;
      
      if (!identifier) {
        return { success: false, message: 'No identifier provided' };
      }

      let results: CartUpdateResult[] = [];
      let primaryResult: CartUpdateResult | null = null;

      // Step 1: Write to Redis immediately (if available and user logged in)
      const redisAvailable = await isRedisAvailable();
      if (redisAvailable && payload.userId) {
        const redisResult = await this.redisService.updateCart(payload);
        results.push(redisResult);
        
        if (redisResult.success) {
          primaryResult = redisResult;
          console.log(`🔥 Cart updated in Redis for ${identifier} (${operation})`);
        }
      }

      // Step 2: Update localStorage (for browser compatibility and guest users)
      if (typeof window !== 'undefined') {
        const browserResult = await this.browserService.updateCart(payload);
        results.push(browserResult);
        
        if (!primaryResult && browserResult.success) {
          primaryResult = browserResult;
          console.log(`💾 Cart updated in localStorage for ${identifier} (${operation})`);
        }
      }

      // Return success if at least one tier succeeded
      if (primaryResult) {
        return primaryResult;
      }

      // If all tiers failed
      const errors = results.filter(r => !r.success).map(r => r.message || 'Unknown error');
      return { 
        success: false, 
        message: 'Failed to update cart in all available storage tiers',
        errors 
      };

    } catch (error) {
      console.error('CartManager updateCart error:', error);
      return { success: false, message: 'Failed to update cart' };
    }
  }

  /**
   * Add item to cart
   */
  async addItem(item: CartItem, userId?: string, sessionId?: string): Promise<CartUpdateResult> {
    try {
      // Get current cart
      const currentCartResult = await this.getCart(userId, sessionId);
      let items: CartItem[] = [];

      if (currentCartResult.cart) {
        items = [...currentCartResult.cart.items];
      }

      // Check if item already exists
      const existingItemIndex = items.findIndex(i => i._uid === item._uid);
      
      if (existingItemIndex >= 0) {
        // Update quantity
        items[existingItemIndex] = {
          ...items[existingItemIndex],
          qty: item.qty,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new item
        items.push({
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      return await this.updateCart({ items, userId, sessionId }, CartOperation.ADD_ITEM);
    } catch (error) {
      console.error('CartManager addItem error:', error);
      return { success: false, message: 'Failed to add item to cart' };
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string, userId?: string, sessionId?: string): Promise<CartUpdateResult> {
    try {
      const currentCartResult = await this.getCart(userId, sessionId);
      
      if (!currentCartResult.cart) {
        return { success: false, message: 'Cart not found' };
      }

      const items = currentCartResult.cart.items.filter(item => item._uid !== itemId);
      return await this.updateCart({ items, userId, sessionId }, CartOperation.REMOVE_ITEM);
    } catch (error) {
      console.error('CartManager removeItem error:', error);
      return { success: false, message: 'Failed to remove item from cart' };
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId?: string, sessionId?: string): Promise<CartUpdateResult> {
    try {
      return await this.updateCart({ items: [], userId, sessionId }, CartOperation.CLEAR_CART);
    } catch (error) {
      console.error('CartManager clearCart error:', error);
      return { success: false, message: 'Failed to clear cart' };
    }
  }

  /**
   * Merge guest cart with user cart on login
   */
  async mergeGuestCartOnLogin(userId: string, guestSessionId?: string): Promise<CartUpdateResult> {
    try {
      // Get guest cart from localStorage
      let guestCart: Cart | null = null;
      if (typeof window !== 'undefined') {
        const guestResult = await this.browserService.getCart(undefined, guestSessionId);
        guestCart = guestResult.cart;
      }

      // Get user cart from Redis
      const userCartResult = await this.getCart(userId);
      const userCart = userCartResult.cart;

      // Merge carts (guest cart items take precedence for conflicts)
      let mergedItems: CartItem[] = [];
      
      if (userCart) {
        mergedItems = [...userCart.items];
      }

      if (guestCart && guestCart.items.length > 0) {
        for (const guestItem of guestCart.items) {
          const existingIndex = mergedItems.findIndex(item => item._uid === guestItem._uid);
          
          if (existingIndex >= 0) {
            // Use guest cart quantity (more recent)
            mergedItems[existingIndex] = {
              ...mergedItems[existingIndex],
              qty: guestItem.qty,
              updatedAt: new Date().toISOString()
            };
          } else {
            mergedItems.push(guestItem);
          }
        }
      }

      // Update with merged cart
      const result = await this.updateCart({ items: mergedItems, userId }, CartOperation.SYNC_CART);
      
      if (result.success) {
        console.log(`🔄 Merged guest cart with user cart for ${userId}`);
        
        // Clear guest cart from localStorage
        if (typeof window !== 'undefined') {
          await this.browserService.deleteCart();
        }
      }

      return result;
    } catch (error) {
      console.error('CartManager mergeGuestCartOnLogin error:', error);
      return { success: false, message: 'Failed to merge guest cart' };
    }
  }

  /**
   * Sync cart from localStorage to Redis (when user logs in)
   */
  private async syncBrowserCartToRedis(cart: Cart, userId: string): Promise<void> {
    try {
      const payload: CartUpdatePayload = {
        items: cart.items,
        userId
      };

      // Sync to Redis
      const redisAvailable = await isRedisAvailable();
      if (redisAvailable) {
        await this.redisService.updateCart(payload);
        console.log(`🔄 Synced localStorage cart to Redis for ${userId}`);
      }
      
    } catch (error) {
      console.error('Error syncing browser cart to Redis:', error);
    }
  }

  /**
   * Health check for Redis and Browser storage
   */
  async getStorageHealth(): Promise<{
    redis: { available: boolean; latency?: number };
    browser: { available: boolean; canWrite: boolean };
  }> {
    const health = {
      redis: { available: false, latency: undefined as number | undefined },
      browser: { available: false, canWrite: false }
    };

    // Check Redis
    try {
      const redisStart = Date.now();
      health.redis.available = await isRedisAvailable();
      health.redis.latency = Date.now() - redisStart;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    // Check Browser Storage
    if (typeof window !== 'undefined') {
      const browserHealth = this.browserService.checkStorageHealth();
      health.browser = {
        available: browserHealth.available,
        canWrite: browserHealth.canWrite
      };
    }

    return health;
  }

  /**
   * Get cart statistics for Redis and Browser storage
   */
  async getCartStatistics(): Promise<{
    redis: { totalCarts: number };
    browser: { hasData: boolean; estimatedSize: number };
  }> {
    const stats = {
      redis: { totalCarts: 0 },
      browser: { hasData: false, estimatedSize: 0 }
    };

    try {
      // Redis stats
      const redisKeys = await this.redisService.getAllCartKeys();
      stats.redis.totalCarts = redisKeys.length;

      // Browser stats
      if (typeof window !== 'undefined') {
        const browserHealth = this.browserService.checkStorageHealth();
        stats.browser = {
          hasData: browserHealth.hasData,
          estimatedSize: browserHealth.estimatedSize
        };
      }
    } catch (error) {
      console.error('Error getting cart statistics:', error);
    }

    return stats;
  }
} 