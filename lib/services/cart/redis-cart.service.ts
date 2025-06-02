"use server";

import { getRedisClient } from '@/lib/redis/connect';
import { Cart, CartItem, CartUpdatePayload, CartRetrievalResult, CartUpdateResult, DEFAULT_CART_CONFIG } from './types';

export class RedisCartService {
  private static instance: RedisCartService;
  private readonly keyPrefix = DEFAULT_CART_CONFIG.redis.keyPrefix;
  private readonly ttl = DEFAULT_CART_CONFIG.redis.ttl;

  static getInstance(): RedisCartService {
    if (!RedisCartService.instance) {
      RedisCartService.instance = new RedisCartService();
    }
    return RedisCartService.instance;
  }

  private generateKey(identifier: string): string {
    return `${this.keyPrefix}${identifier}`;
  }

  private calculateCartTotals(items: CartItem[]): { total: number; itemCount: number } {
    const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const itemCount = items.reduce((count, item) => count + item.qty, 0);
    return { total, itemCount };
  }

  private createCart(userId?: string, sessionId?: string, items: CartItem[] = []): Cart {
    const now = new Date().toISOString();
    const { total, itemCount } = this.calculateCartTotals(items);
    const expiresAt = new Date(Date.now() + this.ttl * 1000).toISOString();

    return {
      userId,
      sessionId,
      items,
      total,
      itemCount,
      createdAt: now,
      updatedAt: now,
      expiresAt
    };
  }

  /**
   * Retrieve cart from Redis
   */
  async getCart(userId?: string, sessionId?: string): Promise<CartRetrievalResult> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return { cart: null, source: 'redis', success: false, message: 'Redis unavailable' };
      }

      const identifier = userId || sessionId;
      if (!identifier) {
        return { cart: null, source: 'redis', success: false, message: 'No identifier provided' };
      }

      const key = this.generateKey(identifier);
      const cartData = await client.get(key);

      if (!cartData) {
        return { cart: null, source: 'redis', success: true, message: 'Cart not found in Redis' };
      }

      const cart: Cart = JSON.parse(cartData);
      
      // Check if cart has expired
      if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
        await this.deleteCart(userId, sessionId);
        return { cart: null, source: 'redis', success: true, message: 'Cart expired and removed' };
      }

      return { cart, source: 'redis', success: true };
    } catch (error) {
      console.error('Redis getCart error:', error);
      return { cart: null, source: 'redis', success: false, message: 'Redis operation failed' };
    }
  }

  /**
   * Update cart in Redis (with TTL)
   */
  async updateCart(payload: CartUpdatePayload): Promise<CartUpdateResult> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return { success: false, message: 'Redis unavailable' };
      }

      const identifier = payload.userId || payload.sessionId;
      if (!identifier) {
        return { success: false, message: 'No identifier provided' };
      }

      // Get existing cart or create new one
      const existingResult = await this.getCart(payload.userId, payload.sessionId);
      let cart: Cart;

      if (existingResult.cart) {
        // Update existing cart
        cart = {
          ...existingResult.cart,
          items: payload.items,
          updatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + this.ttl * 1000).toISOString()
        };
        
        // Recalculate totals
        const { total, itemCount } = this.calculateCartTotals(payload.items);
        cart.total = total;
        cart.itemCount = itemCount;
      } else {
        // Create new cart
        cart = this.createCart(payload.userId, payload.sessionId, payload.items);
      }

      const key = this.generateKey(identifier);
      
      // Store with TTL
      await Promise.all([
        client.set(key, JSON.stringify(cart)),
        client.expire(key, this.ttl)
      ]);

      console.log(`✅ Cart updated in Redis for ${identifier} with ${cart.items.length} items`);
      return { success: true, cart };
    } catch (error) {
      console.error('Redis updateCart error:', error);
      return { success: false, message: 'Redis operation failed' };
    }
  }

  /**
   * Add item to cart
   */
  async addItem(item: CartItem, userId?: string, sessionId?: string): Promise<CartUpdateResult> {
    try {
      const existingResult = await this.getCart(userId, sessionId);
      let items: CartItem[] = [];

      if (existingResult.cart) {
        items = [...existingResult.cart.items];
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

      return await this.updateCart({ items, userId, sessionId });
    } catch (error) {
      console.error('Redis addItem error:', error);
      return { success: false, message: 'Failed to add item to cart' };
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string, userId?: string, sessionId?: string): Promise<CartUpdateResult> {
    try {
      const existingResult = await this.getCart(userId, sessionId);
      
      if (!existingResult.cart) {
        return { success: false, message: 'Cart not found' };
      }

      const items = existingResult.cart.items.filter(item => item._uid !== itemId);
      return await this.updateCart({ items, userId, sessionId });
    } catch (error) {
      console.error('Redis removeItem error:', error);
      return { success: false, message: 'Failed to remove item from cart' };
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId?: string, sessionId?: string): Promise<CartUpdateResult> {
    try {
      return await this.updateCart({ items: [], userId, sessionId });
    } catch (error) {
      console.error('Redis clearCart error:', error);
      return { success: false, message: 'Failed to clear cart' };
    }
  }

  /**
   * Delete cart from Redis
   */
  async deleteCart(userId?: string, sessionId?: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      if (!client) return false;

      const identifier = userId || sessionId;
      if (!identifier) return false;

      const key = this.generateKey(identifier);
      await client.del(key);
      
      console.log(`🗑️ Cart deleted from Redis for ${identifier}`);
      return true;
    } catch (error) {
      console.error('Redis deleteCart error:', error);
      return false;
    }
  }

  /**
   * Get all cart keys (for cleanup jobs)
   */
  async getAllCartKeys(): Promise<string[]> {
    try {
      const client = await getRedisClient();
      if (!client) return [];

      const keys = await client.keys(`${this.keyPrefix}*`);
      return keys;
    } catch (error) {
      console.error('Redis getAllCartKeys error:', error);
      return [];
    }
  }

  /**
   * Cleanup expired carts
   */
  async cleanupExpiredCarts(): Promise<number> {
    try {
      const client = await getRedisClient();
      if (!client) return 0;

      const keys = await this.getAllCartKeys();
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const cartData = await client.get(key);
          if (cartData) {
            const cart: Cart = JSON.parse(cartData);
            if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
              await client.del(key);
              cleanedCount++;
            }
          }
        } catch (error) {
          // If we can't parse the cart, delete it
          await client.del(key);
          cleanedCount++;
        }
      }

      console.log(`🧹 Cleaned up ${cleanedCount} expired carts from Redis`);
      return cleanedCount;
    } catch (error) {
      console.error('Redis cleanup error:', error);
      return 0;
    }
  }
} 