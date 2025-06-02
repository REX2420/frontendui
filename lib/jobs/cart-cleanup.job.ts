"use server";

import { RedisCartService } from '@/lib/services/cart/redis-cart.service';
import { DEFAULT_CART_CONFIG } from '@/lib/services/cart/types';

export class CartCleanupJob {
  private static instance: CartCleanupJob;
  private redisService: RedisCartService;
  private isRunning: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.redisService = RedisCartService.getInstance();
  }

  static getInstance(): CartCleanupJob {
    if (!CartCleanupJob.instance) {
      CartCleanupJob.instance = new CartCleanupJob();
    }
    return CartCleanupJob.instance;
  }

  /**
   * Start the cleanup job
   */
  start(): void {
    if (this.isRunning) {
      console.log('🧹 Cart cleanup job is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = DEFAULT_CART_CONFIG.redis.cleanupInterval * 1000; // Convert to milliseconds

    console.log(`🧹 Starting cart cleanup job with ${intervalMs / 1000}s interval`);

    // Run cleanup immediately
    this.runCleanup().catch(error => {
      console.error('Initial cart cleanup failed:', error);
    });

    // Schedule recurring cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup().catch(error => {
        console.error('Scheduled cart cleanup failed:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('🧹 Cart cleanup job is not running');
      return;
    }

    this.isRunning = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log('🧹 Cart cleanup job stopped');
  }

  /**
   * Run cleanup for Redis storage
   */
  async runCleanup(): Promise<{
    redis: { cleaned: number; success: boolean };
    totalCleaned: number;
  }> {
    const startTime = Date.now();
    console.log('🧹 Starting cart cleanup process...');

    const results = {
      redis: { cleaned: 0, success: false },
      totalCleaned: 0
    };

    try {
      // Cleanup Redis carts
      try {
        results.redis.cleaned = await this.redisService.cleanupExpiredCarts();
        results.redis.success = true;
      } catch (error) {
        console.error('Redis cleanup failed:', error);
      }

      results.totalCleaned = results.redis.cleaned;

      const duration = Date.now() - startTime;
      console.log(
        `🧹 Cart cleanup completed in ${duration}ms: ` +
        `Redis: ${results.redis.cleaned} carts cleaned`
      );

      return results;
    } catch (error) {
      console.error('Cart cleanup process failed:', error);
      return results;
    }
  }

  /**
   * Get cleanup job status
   */
  getStatus(): {
    isRunning: boolean;
    intervalSeconds: number;
    nextRunEstimate?: Date;
  } {
    return {
      isRunning: this.isRunning,
      intervalSeconds: DEFAULT_CART_CONFIG.redis.cleanupInterval,
      nextRunEstimate: this.isRunning && this.cleanupInterval 
        ? new Date(Date.now() + DEFAULT_CART_CONFIG.redis.cleanupInterval * 1000)
        : undefined
    };
  }

  /**
   * Force run cleanup manually
   */
  async forceCleanup(): Promise<any> {
    console.log('🧹 Force running cart cleanup...');
    return await this.runCleanup();
  }

  /**
   * Get detailed cleanup statistics
   */
  async getCleanupStats(): Promise<{
    redis: {
      totalKeys: number;
      expiredKeys: number;
      healthCheck: boolean;
    };
  }> {
    const stats = {
      redis: {
        totalKeys: 0,
        expiredKeys: 0,
        healthCheck: false
      }
    };

    try {
      // Redis stats
      const redisKeys = await this.redisService.getAllCartKeys();
      stats.redis.totalKeys = redisKeys.length;
      stats.redis.healthCheck = true;
      
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
    }

    return stats;
  }
}

// Export singleton instance
export const cartCleanupJob = CartCleanupJob.getInstance(); 