import dotenv from "dotenv"
import Redis from "ioredis"
dotenv.config()

// Redis client for caching file data
export const redisCache = new Redis({
  host: process.env.redis_host || '127.0.0.1',
  port: 6379,
});
redisCache.on('connect', () => console.log('Redis Cache connected!'));
redisCache.on('error', (err) => console.error('Redis Cache Error:', err));
