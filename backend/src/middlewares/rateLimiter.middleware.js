const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { getRedisClient } = require("../config/redis");


/**
 * RedisStore factory — ek jagah define, teen limiters reuse karenge.
 *
 * sendCommand: (...args) => getRedisClient().call(...args)
 * Ye ioredis ka generic command sender hai — rate-limit-redis isse
 * arbitrary Redis commands bhejta hai (INCR, EXPIRE, etc.) bina
 * specific Redis client API pe depend kiye.
 */
const createRedisStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => getRedisClient().call(...args),
    prefix, // Redis me keys kaise store hongi: "rl:login:192.168.1.1"
  });

// ─────────────────────────────────────────────────────────
// 1. LOGIN LIMITER — strict (brute force protection)
// ─────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10,                   // 15 min me max 10 login attempts per IP
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,  // RateLimit-* headers response me bhejo (RFC 6585)
  legacyHeaders: false,   // X-RateLimit-* headers band karo (deprecated)
  store: createRedisStore("rl:login:"),

  // Sirf failed attempts count karo — successful login pe count reset karo
  skipSuccessfulRequests: true,
  // Kyun? Agar koi user sahi password se login kare, uska counter reset ho —
  // sirf wrong attempts track karo. Real brute force protection.
});

// ─────────────────────────────────────────────────────────
// 2. API LIMITER — general authenticated routes ke liye
// ─────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 200,                  // authenticated users ke liye generous limit
  message: {
    message: "Too many requests. Please slow down and try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:api:"),
});

// ─────────────────────────────────────────────────────────
// 3. PUBLIC LIMITER — unauthenticated public routes ke liye
// ─────────────────────────────────────────────────────────
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 60,                   // public routes pe thoda strict — scraping se bachao
  message: {
    message: "Rate limit exceeded for public endpoints. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:public:"),
});

module.exports = { loginLimiter, apiLimiter, publicLimiter };