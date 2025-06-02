import { connectToRedis, isRedisAvailable, getRedisClient } from './connect';

export async function testRedisConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🔍 Testing Redis connection...');
    
    // Test basic availability
    const available = await isRedisAvailable();
    if (!available) {
      return {
        success: false,
        message: 'Redis is not available. Make sure Redis server is running on redis://localhost:6379'
      };
    }

    // Test getting client
    const client = await getRedisClient();
    if (!client) {
      return {
        success: false,
        message: 'Failed to get Redis client'
      };
    }

    // Test basic operations
    const testKey = 'vibecart:test:connection';
    const testValue = JSON.stringify({ 
      timestamp: new Date().toISOString(),
      test: 'connection-check'
    });

    // Set a test value
    await client.set(testKey, testValue, { EX: 60 }); // Expire in 60 seconds
    
    // Get the test value
    const retrievedValue = await client.get(testKey);
    
    // Clean up
    await client.del(testKey);

    if (retrievedValue === testValue) {
      return {
        success: true,
        message: '✅ Redis connection successful! All operations working correctly.',
        details: {
          available: true,
          client: 'connected',
          operations: 'working',
          url: process.env.REDIS_URL || 'redis://localhost:6379'
        }
      };
    } else {
      return {
        success: false,
        message: 'Redis connected but operations failed',
        details: { expected: testValue, received: retrievedValue }
      };
    }

  } catch (error) {
    console.error('❌ Redis connection test failed:', error);
    return {
      success: false,
      message: `Redis connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : error }
    };
  }
}

// Export a simple function to run the test
export async function runRedisTest() {
  const result = await testRedisConnection();
  console.log('\n🔍 Redis Connection Test Results:');
  console.log('Success:', result.success);
  console.log('Message:', result.message);
  if (result.details) {
    console.log('Details:', result.details);
  }
  return result;
} 