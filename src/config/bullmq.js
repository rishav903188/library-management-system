const Redis = require("ioredis");

/**
 * BullMQ ke liye ALAG Redis connection banao.
 *
 * Kyun alag? Kyunki BullMQ internally blocking Redis commands use karta hai
 * (BRPOP, BLMOVE) — ye same connection pe kiye jaayein jo cache/rate-limit use kar
 * raha hai to wo operations block ho jaayenge. Separate connection = no interference.
 *
 * maxRetriesPerRequest: null — BullMQ workers ke liye ZAROORI hai.
 * Default value set hone par BullMQ error throw karta hai.
 */
const createBullMQConnection = () => {
  return new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

module.exports = { createBullMQConnection };