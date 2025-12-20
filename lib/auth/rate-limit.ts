// Simple in-memory rate limiter
// In production, consider using Redis for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // If no entry or expired, create new one
  if (!entry || entry.resetAt < now) {
    store.set(key, {
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
