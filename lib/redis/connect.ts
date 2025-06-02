import { createClient, RedisClientType } from 'redis';

interface RedisConnection {
  client: RedisClientType | null;
  promise: Promise<RedisClientType> | null;
}

let cached: RedisConnection = (global as any).redis;

if (!cached) {
  cached = (global as any).redis = {
    client: null,
    promise: null,
  };
}

export const connectToRedis = async (): Promise<RedisClientType> => {
  if (cached.client) return cached.client;

  if (!cached.promise) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    cached.promise = new Promise(async (resolve, reject) => {
      try {
        const client = createClient({
          url: redisUrl,
          socket: {
            connectTimeout: 10000,
            keepAlive: 30000,
          },
        });

        client.on('connect', () => {
          console.log('✅ Redis connected successfully');
        });

        client.on('error', (error: Error) => {
          console.error('❌ Redis connection error:', error);
          reject(error);
        });

        client.on('end', () => {
          console.log('🔴 Redis connection closed');
        });

        await client.connect();
        resolve(client as RedisClientType);
      } catch (error) {
        reject(error);
      }
    });
  }

  try {
    cached.client = await cached.promise;
    return cached.client;
  } catch (error) {
    // Reset on error
    cached.promise = null;
    cached.client = null;
    throw error;
  }
};

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  try {
    return await connectToRedis();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
};

// Utility function to check if Redis is available
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis availability check failed:', error);
    return false;
  }
};

// Graceful shutdown
export const disconnectRedis = async (): Promise<void> => {
  if (cached.client) {
    await cached.client.quit();
    cached.client = null;
    cached.promise = null;
  }
}; 