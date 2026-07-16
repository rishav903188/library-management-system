const { getRedisClient } = require("../config/redis");

const TTL = {
  BOOKS_LIST:          60 * 5,    // 5 minutes
  BOOK_DETAIL:         60 * 10,   // 10 minutes
  ANALYTICS_OVERVIEW:  60 * 5,    // 5 minutes — dashboard top cards
  ANALYTICS_POPULAR:   60 * 10,   // 10 minutes — most borrowed changes slowly
  ANALYTICS_OVERDUE:   60 * 2,    // 2 minutes — overdue list time-sensitive hai
  DEFAULT:             60 * 5,
};

const CACHE_KEYS = {
  booksList:               ()      => "books:all",
  bookDetail:              (id)    => `books:${id}`,
  analyticsOverview:       ()      => "analytics:overview",
  analyticsMostBorrowed:   (limit) => `analytics:most-borrowed:${limit}`,
  analyticsOverdue:        ()      => "analytics:overdue",
};

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
    return null;
  }
};

const cacheSet = async (key, value, ttl = TTL.DEFAULT) => {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttl);
    console.log(`✅ Cache SET: ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    console.error(`Cache SET failed [${key}]:`, err.message);
  }
};

const cacheDel = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
    console.log(`🗑️  Cache DEL: ${key}`);
  } catch (err) {
    console.error(`Cache DEL failed [${key}]:`, err.message);
  }
};

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