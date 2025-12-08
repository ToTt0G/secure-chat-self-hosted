// lib/redis.ts
import Redis from "ioredis";

declare global {
  var redis: Redis | undefined;
}

const getRedisUrl = () => {
  // 1. Prefer env var (set in docker-compose.prod.yml)
  if (process.env.REDIS_URL) return process.env.REDIS_URL;

  // 2. Fallback for local dev
  return "redis://server.local:6379";
};

const redis = global.redis || new Redis(getRedisUrl());

if (process.env.NODE_ENV !== "production") global.redis = redis;

export default redis;
