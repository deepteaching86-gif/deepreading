// Redis configuration (Optional)

import Redis from 'ioredis';
import { env } from './env';

let redisClient: Redis | null = null;

try {
  redisClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('⚠️  Redis unavailable. Continuing without cache.');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('error', (_error) => {
    console.log('⚠️  Redis not available (cache disabled)');
  });

  redisClient.on('ready', () => {
    console.log('🚀 Redis is ready');
  });
} catch (error) {
  console.log('⚠️  Redis initialization skipped');
  redisClient = null;
}

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    console.log('📦 Redis disconnected');
  }
}

export { redisClient };
