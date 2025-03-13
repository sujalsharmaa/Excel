import dotenv from "dotenv";
import { createClient } from "redis";
dotenv.config();

// Redis client for caching file data
export const redisCache = createClient({
  socket: {
    host: process.env.redis_host || "127.0.0.1",
    port: 6379,
  },
});

redisCache.on("connect", async() => {
  console.log("Redis Cache connected!");
  console.log("Redis Cache JSON:"); //removed because json is not a property of the client.
});

redisCache.on("error", (err) => console.error("Redis Cache Error:", err));

await redisCache.connect()