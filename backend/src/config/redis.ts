/**
 * Redis Configuration
 *
 * Sets up Redis connection for BullMQ queue system.
 * Redis stores job queues and acts as a cache for rate limiting.
 */

import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Redis connection instance
let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  // Use REDIS_URL if provided (Redis Cloud), otherwise use host/port
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      // ✅ REQUIRED by BullMQ
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  } else {
    const redisPort = parseInt(process.env.REDIS_PORT || '6379') || 6379;
    
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: redisPort,
      // ✅ REQUIRED by BullMQ
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    });
  }

  redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });

  redisClient.on("error", (error: any) => {
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Redis connection error: Redis server is not running!");
      console.error("   Please start Redis:");
      console.error("   Windows: redis-server (or start Redis service)");
      console.error("   Docker: docker run -d -p 6379:6379 redis:alpine");
    } else {
      console.error("❌ Redis connection error:", error);
    }
  });

  return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("🛑 Redis connection closed");
  }
}
