import Redis from 'ioredis';
import { logProductionError } from './errorUtils';

// Only attempt connection if REDIS_URL is explicitly provided
const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redisClient.on('error', (err) => {
      logProductionError('redis_connection', 'src/lib/redis.ts', 'network', err);
    });
    
    console.log('[Redis] Connected to cache.');
  } catch (err) {
    logProductionError('redis_init', 'src/lib/redis.ts', 'network', err);
  }
} else {
  console.warn('[Redis] REDIS_URL not set. Caching disabled.');
}

export const redis = redisClient;
export const CACHE_TTL = 3600; // 1 hour default
