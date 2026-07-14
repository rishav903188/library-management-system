// src/config/redis.js
const Redis = require("ioredis");

// Singleton pattern — same jo Prisma ke liye kiya tha
// Ek hi Redis connection poori app me reuse hogi
let redisClient = null;

const getRedisClient = () => {
  if (redisClient) return redisClient;

  redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    // Agar Redis down ho to app crash na kare — retry karta rahe
    retryStrategy: (times) => {
      if (times > 10) {
        console.error("❌ Redis: max retries reached, giving up");
        return null; // null = stop retrying
      }
      const delay = Math.min(times * 200, 2000); // exponential backoff, max 2s
      console.log(`🔄 Redis retry attempt ${times} in ${delay}ms`);
      return delay;
    },

    // Connection events
    lazyConnect: false, // immediately connect on creation
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err) => {
    // Error log karo but app crash mat karo
    // Redis down hone par app degraded mode me chalti rahe
    // (cache miss hogi, DB se fresh data aayega — slow but working)
    console.error("❌ Redis error:", err.message);
  });

  redisClient.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
  });

  return redisClient;
};

// Connection test (server startup pe call hoga)
const connectRedis = async () => {
  const client = getRedisClient();
  try {
    await client.ping();
    console.log("✅ Redis ping successful");
  } catch (err) {
    // Redis unavailable — app phir bhi chalegi (degraded mode)
    console.error("⚠️  Redis unavailable at startup:", err.message);
    console.error("   App will run without caching/queuing until Redis recovers.");
  }
};

module.exports = { getRedisClient, connectRedis };