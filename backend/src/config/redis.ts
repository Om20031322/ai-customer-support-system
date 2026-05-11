import { createClient, RedisClientType } from "redis";
import { env } from "./env";

let client: RedisClientType | null = null;
let available = false;

export async function connectRedis() {
  if (!env.redisUrl) {
    console.warn("[Redis] REDIS_URL not configured; PostgreSQL fallback enabled");
    return;
  }

  if (client) {
    return;
  }

  client = createClient({
    url: env.redisUrl,
    socket: {
      reconnectStrategy: false
    }
  });

  client.on("error", (error) => {
    available = false;
    console.error(`[Redis] Connection error: ${error.message}`);
  });

  try {
    await client.connect();
    available = true;
    console.log("[Redis] Connected");
  } catch (error) {
    available = false;
    console.error(
      `[Redis] Unavailable; PostgreSQL fallback enabled: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
}

export function getRedisClient() {
  return available ? client : null;
}

export async function disconnectRedis() {
  if (client?.isOpen) {
    await client.disconnect();
  }

  client = null;
  available = false;
}
