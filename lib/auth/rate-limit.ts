// Rate limiter with Redis support for distributed deployments
// Falls back to in-memory for development/single-instance deployments

import Redis from 'ioredis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Redis client singleton
let redisClient: Redis | null = null;
let redisAvailable = false;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: REDIS_URL not configured. Rate limiting will use in-memory store (not recommended for multi-instance deployments).');
    }
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('Redis connected for rate limiting');
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      redisAvailable = false;
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    // Attempt connection
    redisClient.connect().catch(() => {
      redisAvailable = false;
    });

    return redisClient;
  } catch (err) {
    console.error('Failed to initialize Redis client:', err);
    return null;
  }
}

// Initialize Redis on module load
getRedisClient();

// Fallback in-memory store for development or Redis failures
const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (in-memory fallback only)
setInterval(() => {
  const now = Date.now();
  memoryStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      memoryStore.delete(key);
    }
  });
}, 60000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// Redis-based rate limit check
async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis || !redisAvailable) {
    return checkRateLimitMemory(key, config);
  }

  try {
    const now = Date.now();
    const redisKey = `ratelimit:${key}`;
    const windowSecs = Math.ceil(config.windowMs / 1000);

    // Use Redis MULTI for atomic operations
    const pipeline = redis.multi();
    pipeline.incr(redisKey);
    pipeline.pttl(redisKey);

    const results = await pipeline.exec();
    if (!results) {
      return checkRateLimitMemory(key, config);
    }

    const [[, count], [, ttl]] = results as [[null, number], [null, number]];

    // Set expiry if this is a new key (ttl = -1 means no expiry set)
    if (ttl === -1) {
      await redis.pexpire(redisKey, config.windowMs);
    }

    const resetAt = ttl > 0 ? now + ttl : now + config.windowMs;

    if (count > config.maxAttempts) {
      return {
        success: false,
        remaining: 0,
        resetAt,
      };
    }

    return {
      success: true,
      remaining: config.maxAttempts - count,
      resetAt,
    };
  } catch (err) {
    console.error('Redis rate limit error, falling back to memory:', err);
    return checkRateLimitMemory(key, config);
  }
}

// In-memory rate limit check (fallback)
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  // If no entry or expired, create new one
  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxAttempts) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.maxAttempts - entry.count,
    resetAt: entry.resetAt,
  };
}

// Synchronous wrapper for backward compatibility
// Uses async internally but provides sync interface
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  // For synchronous contexts, always use memory store
  // The async version should be used in API routes
  return checkRateLimitMemory(key, config);
}

// Async version for API routes (preferred)
export async function checkRateLimitAsync(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimitRedis(key, config);
}

// Rate limit configurations
export const RATE_LIMITS = {
  // Login: 5 attempts per 15 minutes per email
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  },
  // Verify: 5 attempts per 15 minutes per email (to prevent brute force)
  verify: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  },
  // Global IP limit: 20 auth attempts per 15 minutes
  globalIp: {
    maxAttempts: 20,
    windowMs: 15 * 60 * 1000,
  },
  // Application submission: 5 applications per 15 minutes per IP
  application: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  },
  // Application global: 50 applications per 15 minutes across all IPs (burst protection)
  applicationGlobal: {
    maxAttempts: 50,
    windowMs: 15 * 60 * 1000,
  },
};
