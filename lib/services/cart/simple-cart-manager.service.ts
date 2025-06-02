"use server";

import { RedisCartService } from './redis-cart.service';
import { BrowserCartService } from './browser-cart.service';
import { 
  Cart, 
  CartItem, 
  CartUpdatePayload, 
  CartRetrievalResult, 
  CartUpdateResult, 
  CartOperation 
} from './types';
import { isRedisAvailable } from '@/lib/redis/connect';

export class SimpleCartManagerService {
  private static instance: SimpleCartManagerService;
  private redisService: RedisCartService;
  private browserService: BrowserCartService;

  private constructor() {
    this.redisService = RedisCartService.getInstance();
    this.browserService = BrowserCartService.getInstance();
  }

  static getInstance(): SimpleCartManagerService {
    if (!SimpleCartManagerService.instance) {
      SimpleCartManagerService.instance = new SimpleCartManagerService();
    }
    return SimpleCartManagerService.instance;
  }

  /**
   * Simple Cart Retrieval Flow:
   * 1. If logged in → Check Redis
   * 2. If guest OR Redis down → Check localStorage
   * 3. Merge guest cart on login
   */
  async getCart(userId?: string, sessionId?: string): Promise<CartRetrievalResult> {
    try {
      const identifier = userId || sessionId;
      
      if (!identifier) {
        return { cart: null, source: 'redis', success: false, message: 'No identifier provided' };
      }

      // For logged-in users: Try Redis first
      if (userId) {
        const redisAvailable = await isRedisAvailable();
        
        if (redisAvailable) {
          const redisResult = await this.redisService.getCart(userId);
          
          if (redisResult.success && redisResult.cart) {
            console.log(`🔥 Cart retrieved from Redis for ${userId}`);
            return redisResult;
          }
        }
        
        // Redis down for logged-in user → fallback to localStorage
        console.warn(`⚠️ Redis unavailable for user ${userId}, falling back to localStorage`);
      }

      // For guests OR when Redis is down → use localStorage
      if (typeof window !== 'undefined') {
        const browserResult = await this.browserService.getCart(userId, sessionId);
        
        if (browserResult.success && browserResult.cart) {
          console.log(`💾 Cart retrieved from localStorage for ${identifier}`);
          return { ...browserResult, source: 'localStorage' };
        }
      }

      // No cart found anywhere
      return { cart: null, source: 'redis', success: true, message: 'No cart found' };
      
    } catch (error) {
      console.error('SimpleCartManager getCart error:', error);
      return { cart: null, source: 'redis', success: false, message: 'Failed to retrieve cart' };
    }
  }

  /**
   * Simple Cart Update Flow:
   * 1. If logged in → Write to Redis
   * 2. If guest OR Redis down → Write to localStorage
   * 3. Return success immediately
   */
  async updateCart(payload: CartUpdatePayload, operation: CartOperation = CartOperation.SYNC_CART): Promise<CartUpdateResult> {
    try {
      const identifier = payload.userId || payload.sessionId;
      
      if (!identifier) {
        return { success: false, message: 'No identifier provided' };
      }

      // For logged-in users: Try Redis first
      if (payload.userId) {
        const redisAvailable = await isRedisAvailable();
        
        if (redisAvailable) {
          const redisResult = await this.redisService.updateCart(payload);
          
          if (redisResult.success) {
            console.log(`🔥 Cart updated in Redis for ${payload.userId} (${operation})`);
            
            // Also update localStorage as backup
            if (typeof window !== 'undefined') {
              await this.browserService.updateCart(payload);
            }
            
            return redisResult;
          }
        }
        
        console.warn(`⚠️ Redis unavailable for user ${payload.userId}, using localStorage`);
      }

      // For guests OR when Redis is down → use localStorage
      if (typeof window !== 'undefined') {
        const browserResult = await this.browserService.updateCart(payload);
        
        if (browserResult.success) {
          console.log(`💾 Cart updated in localStorage for ${identifier} (${operation})`);
        }
        
        return browserResult;
      }

      return { success: false, message: 'No storage available' };

    } catch (error) {
      console.error('SimpleCartManager updateCart error:', error);
      return { success: false, message: 'Failed to update cart' };
    }
  }

  /**
   * Add item to cart
   */
  async addItem(item: CartItem, userId?: string, sessionId?: string): Promise<CartUpdateResult> {
    try {
      const currentCartResult = await this.getCart(userId, sessionId);
      let items: CartItem[] = [];

      if (currentCartResult.cart) {
        items = [...currentCartResult.cart.items];
      }

      const existingItemIndex = items.findIndex(i => i._uid === item._uid);
      
      if (existingItemIndex >= 0) {
        items[existingItemIndex] = {
          ...items[existingItemIndex],
          qty: item.qty,
          updatedAt: new Date().toISOString()
        };
      } else {
        items.push({
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      return await this.updateCart({ items, userId, sessionId }, CartOperation.ADD_ITEM);
    } catch (error) {
      console.error('SimpleCartManager addItem error:', error);
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
      console.error('SimpleCartManager removeItem error:', error);
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
      console.error('SimpleCartManager clearCart error:', error);
      return { success: false, message: 'Failed to clear cart' };
    }
  }

  /**
   * Merge guest cart when user logs in
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

      // Merge carts (guest cart takes precedence)
      let mergedItems: CartItem[] = [];
      
      if (userCart) {
        mergedItems = [...userCart.items];
      }

      if (guestCart && guestCart.items.length > 0) {
        for (const guestItem of guestCart.items) {
          const existingIndex = mergedItems.findIndex(item => item._uid === guestItem._uid);
          
          if (existingIndex >= 0) {
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

      // Save merged cart to Redis
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
      console.error('SimpleCartManager mergeGuestCartOnLogin error:', error);
      return { success: false, message: 'Failed to merge guest cart' };
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
   * Get simple cart statistics
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