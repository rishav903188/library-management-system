// src/utils/cache.js
const { getRedisClient } = require("../config/redis");

const DEFAULT_TTL = 60 * 5; // 5 minutes (seconds me)

/**
 * Cache se value lo.
 * Returns parsed value ya null (agar cache miss ya Redis down).
 */
const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`Cache GET failed [${key}]:`, err.message);
    return null; // graceful degradation
  }
};

/**
 * Cache me value set karo with TTL (seconds me).
 */
const cacheSet = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttl);
    // "EX" = expire in seconds — TTL ke baad key automatically delete hogi
  } catch (err) {
    console.error(`Cache SET failed [${key}]:`, err.message);
    // Silently fail — data phir bhi DB se serve hoga
  }
};

/**
 * Cache se key delete karo (invalidation ke liye).
 */
const cacheDel = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err) {
    console.error(`Cache DEL failed [${key}]:`, err.message);
  }
};

/**
 * Pattern se matching saari keys delete karo.
 * e.g., cacheClear("books:*") — saari books-related cache entries hata do
 */
const cacheClear = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      console.log(`🗑️  Cache cleared: ${keys.length} keys matching "${pattern}"`);
    }
  } catch (err) {
    console.error(`Cache CLEAR failed [${pattern}]:`, err.message);
  }
};

module.exports = { cacheGet, cacheSet, cacheDel, cacheClear, DEFAULT_TTL };