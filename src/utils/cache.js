// src/utils/cache.js
const { getRedisClient } = require("../config/redis");

// TTL constants — ek jagah define, sab jagah reuse
const TTL = {
  BOOKS_LIST:   60 * 5,   // 5 minutes
  BOOK_DETAIL:  60 * 10,  // 10 minutes
  DEFAULT:      60 * 5,   // fallback
};

// Cache Key builders — string concatenation ki jagah functions use karo
// Isse typos avoid hote hain aur key format consistent rehta hai
const CACHE_KEYS = {
  booksList: ()       => "books:all",
  bookDetail: (id)    => `books:${id}`,
};

/**
 * Cache se value lo.
 * Returns parsed value ya null (cache miss ya Redis down).
 */
const cacheGet = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (value) {
      console.log(`🎯 Cache HIT: ${key}`);
      return JSON.parse(value);
    }
    console.log(`💨 Cache MISS: ${key}`);
    return null;
  } catch (err) {
    console.error(`Cache GET failed [${key}]:`, err.message);
    return null; // graceful degradation — DB se fetch hoga
  }
};

/**
 * Cache me value set karo with TTL.
 */
const cacheSet = async (key, value, ttl = TTL.DEFAULT) => {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttl);
    console.log(`✅ Cache SET: ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    console.error(`Cache SET failed [${key}]:`, err.message);
    // Silently fail — response already DB se aa chuka hai
  }
};

/**
 * Single key delete.
 */
const cacheDel = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
    console.log(`🗑️  Cache DEL: ${key}`);
  } catch (err) {
    console.error(`Cache DEL failed [${key}]:`, err.message);
  }
};

/**
 * Pattern se matching saari keys delete karo.
 * e.g., cacheClear("books:*") — saari books cache entries hata do
 *
 * ⚠️  Production warning: KEYS command O(N) hai — bahut badi Redis me slow ho sakta hai.
 * Production me SCAN use karna chahiye. Abhi dev ke liye KEYS theek hai.
 */
const cacheClear = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      console.log(`🗑️  Cache CLEAR: ${keys.length} keys matching "${pattern}"`);
    }
  } catch (err) {
    console.error(`Cache CLEAR failed [${pattern}]:`, err.message);
  }
};

module.exports = { cacheGet, cacheSet, cacheDel, cacheClear, CACHE_KEYS, TTL };