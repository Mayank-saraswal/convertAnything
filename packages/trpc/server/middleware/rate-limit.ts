import { getRedisConnection } from "@repo/queue";

/**
 * Simple Redis-backed rate limiter.
 * @param identifier IP or User ID
 * @param endpoint Endpoint name
 * @param limit Max requests per window
 * @param windowMs Window size in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const redis = getRedisConnection();
  const key = `ratelimit:${endpoint}:${identifier}`;
  
  const current = await redis.get(key);
  
  if (current && parseInt(current, 10) >= limit) {
    return false;
  }
  
  const multi = redis.multi();
  multi.incr(key);
  if (!current) {
    multi.pexpire(key, windowMs);
  }
  
  await multi.exec();
  
  return true;
}
