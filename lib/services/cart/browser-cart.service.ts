"use client";

import { Cart, CartItem, CartUpdatePayload, CartRetrievalResult, CartUpdateResult, DEFAULT_CART_CONFIG } from './types';

export class BrowserCartService {
  private static instance: BrowserCartService;
  private readonly storageKey = DEFAULT_CART_CONFIG.browser.storageKey;
  private readonly maxSize = DEFAULT_CART_CONFIG.browser.maxSize;

  static getInstance(): BrowserCartService {
    if (!BrowserCartService.instance) {
      BrowserCartService.instance = new BrowserCartService();
    }
    return BrowserCartService.instance;
  }

  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private calculateCartTotals(items: CartItem[]): { total: number; itemCount: number } {
    const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const itemCount = items.reduce((count, item) => count + item.qty, 0);
    return { total, itemCount };
  }

  private createCart(userId?: string, sessionId?: string, items: CartItem[] = []): Cart {
    const now = new Date().toISOString();
    const { total, itemCount } = this.calculateCartTotals(items);

    return {
      userId,
      sessionId,
      items,
      total,
      itemCount,
      createdAt: now,
      updatedAt: now
    };
  }

  private generateSessionId(): string {
    if (!this.isClient()) return '';
    
    // Try to get existing session ID from sessionStorage
    let sessionId = sessionStorage.getItem('vibecart-session-id');
    
    if (!sessionId) {
      // Generate new session ID
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('vibecart-session-id', sessionId);
    }
    
    return sessionId;
  }

  private getStorageData(): any {
    if (!this.isClient()) return null;

    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  private setStorageData(data: any): boolean {
    if (!this.isClient()) return false;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      // Handle quota exceeded or other localStorage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldData();
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(data));
          return true;
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Get cart from localStorage
   */
  async getCart(userId?: string, sessionId?: string): Promise<CartRetrievalResult> {
    try {
      if (!this.isClient()) {
        return { cart: null, source: 'localStorage', success: false, message: 'Not in browser environment' };
      }

      const data = this.getStorageData();
      if (!data || !data.state?.cart?.cartItems) {
        return { cart: null, source: 'localStorage', success: true, message: 'No cart found in localStorage' };
      }

      const items: CartItem[] = data.state.cart.cartItems;
      const identifier = userId || sessionId || this.generateSessionId();
      
      // Check if cart items exceed max size
      if (items.length > this.maxSize) {
        console.warn(`Cart size (${items.length}) exceeds maximum (${this.maxSize}), truncating...`);
        items.splice(this.maxSize);
      }

      const cart = this.createCart(userId, sessionId || identifier, items);
      
      return { cart, source: 'localStorage', success: true };
    } catch (error) {
      console.error('Browser getCart error:', error);
      return { cart: null, source: 'localStorage', success: false, message: 'Failed to read cart from localStorage' };
    }
  }

  /**
   * Update cart in localStorage
   */
  async updateCart(payload: CartUpdatePayload): Promise<CartUpdateResult> {
    try {
      if (!this.isClient()) {
        return { success: false, message: 'Not in browser environment' };
      }

      // Check item limit
      if (payload.items.length > this.maxSize) {
        console.warn(`Attempting to save ${payload.items.length} items, but max is ${this.maxSize}`);
        payload.items = payload.items.slice(0, this.maxSize);
      }

      const cart = this.createCart(payload.userId, payload.sessionId, payload.items);
      
      // Get existing storage data or create new
      let storageData = this.getStorageData() || {};
      
      // Update cart data in Zustand format for compatibility
      storageData.state = {
        ...storageData.state,
        cart: {
          cartItems: payload.items
        },
        isAuthenticated: !!payload.userId,
        hasChanges: true
      };

      // Save to localStorage
      const saved = this.setStorageData(storageData);
      if (!saved) {
        return { success: false, message: 'Failed to save cart to localStorage' };
      }

      console.log(`💾 Cart updated in localStorage with ${payload.items.length} items`);
      return { success: true, cart };
    } catch (error) {
      console.error('Browser updateCart error:', error);
      return { success: false, message: 'Failed to update cart in localStorage' };
    }
  }

  private clearOldData(): void {
    if (!this.isClient()) return;

    try {
      // Clear old cart data but keep user preferences
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cart-') || key.startsWith('old-cart-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing old data:', error);
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
        // Add new item (check size limit)
        if (items.length >= this.maxSize) {
          return { success: false, message: `Cart is full. Maximum ${this.maxSize} items allowed.` };
        }
        
        items.push({
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      return await this.updateCart({ items, userId, sessionId });
    } catch (error) {
      console.error('Browser addItem error:', error);
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
      console.error('Browser removeItem error:', error);
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
      console.error('Browser clearCart error:', error);
      return { success: false, message: 'Failed to clear cart' };
    }
  }

  /**
   * Delete cart from localStorage
   */
  async deleteCart(): Promise<boolean> {
    try {
      if (!this.isClient()) return false;

      localStorage.removeItem(this.storageKey);
      console.log(`🗑️ Cart deleted from localStorage`);
      return true;
    } catch (error) {
      console.error('Browser deleteCart error:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available and has space
   */
  checkStorageHealth(): {
    available: boolean;
    hasData: boolean;
    estimatedSize: number;
    canWrite: boolean;
  } {
    if (!this.isClient()) {
      return { available: false, hasData: false, estimatedSize: 0, canWrite: false };
    }

    try {
      const data = this.getStorageData();
      const hasData = !!data;
      const estimatedSize = data ? JSON.stringify(data).length : 0;
      
      // Test write capability
      const testKey = 'vibecart-test';
      const testValue = 'test';
      localStorage.setItem(testKey, testValue);
      const canWrite = localStorage.getItem(testKey) === testValue;
      localStorage.removeItem(testKey);

      return {
        available: true,
        hasData,
        estimatedSize,
        canWrite
      };
    } catch (error) {
      return { available: false, hasData: false, estimatedSize: 0, canWrite: false };
    }
  }
} 