import { Redis } from "ioredis";

let redisConnection: Redis | null = null;

/**
 * Get or create a shared Redis connection.
 */
export function getRedisConnection(redisUrl?: string): Redis {
  if (redisConnection) return redisConnection;

  const url = redisUrl || process.env.REDIS_URL || "redis://localhost:6379";

  redisConnection = new Redis(url, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
  });

  redisConnection.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message);
  });

  redisConnection.on("connect", () => {
    console.log("[Redis] Connected successfully");
  });

  return redisConnection;
}

/**
 * Close the Redis connection gracefully.
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
