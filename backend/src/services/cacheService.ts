import { getRedisClient } from "../config/redis";
import { recordRedisHit, recordRedisMiss } from "./metricsService";

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get(key);

    if (!cached) {
      recordRedisMiss();
      console.log("[Redis] Cache miss");
      return null;
    }

    recordRedisHit();
    console.log("[Redis] Cache hit");
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(
      `[Redis] Cache read failed: ${error instanceof Error ? error.message : "unknown error"}`
    );
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number) {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
  } catch (error) {
    console.error(
      `[Redis] Cache write failed: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }
}

export async function invalidateCacheKeys(keys: string[]) {
  const redis = getRedisClient();

  if (!redis || keys.length === 0) {
    return;
  }

  try {
    await redis.del(keys);
    console.log("[Redis] Cache invalidated");
  } catch (error) {
    console.error(
      `[Redis] Cache invalidation failed: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}

export async function invalidateTicketCaches(userId?: string | null) {
  await invalidateCacheKeys([
    "analytics:global",
    "tickets:all",
    ...(userId ? [`analytics:user:${userId}`, `tickets:user:${userId}`] : [])
  ]);
}
