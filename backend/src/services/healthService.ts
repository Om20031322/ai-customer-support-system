import { env } from "../config/env";
import { getRedisClient } from "../config/redis";
import { kafka } from "../kafka/client";
import { prisma } from "../prisma/client";

type HealthStatus = "ok" | "degraded" | "down";

export async function getHealthStatus() {
  const [postgres, redis, kafkaStatus, aiService] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkKafka(),
    checkAiService()
  ]);

  const checks = [postgres, redis, kafkaStatus, aiService];
  const status: HealthStatus = checks.every((check) => check.status === "ok")
    ? "ok"
    : checks.some((check) => check.status === "down")
      ? "degraded"
      : "degraded";

  return {
    status,
    backend: "ok",
    postgres,
    redis,
    kafka: kafkaStatus,
    aiService,
    uptime: process.uptime()
  };
}

async function checkPostgres() {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 2000);
    return { status: "ok" as const };
  } catch (error) {
    return { status: "down" as const, error: getErrorMessage(error) };
  }
}

async function checkRedis() {
  const redis = getRedisClient();

  if (!redis) {
    return { status: "degraded" as const, error: "Redis unavailable; PostgreSQL fallback active" };
  }

  try {
    await withTimeout(redis.ping(), 2000);
    return { status: "ok" as const };
  } catch (error) {
    return { status: "degraded" as const, error: getErrorMessage(error) };
  }
}

async function checkKafka() {
  const admin = kafka.admin();

  try {
    await withTimeout(admin.connect(), 3000);
    await withTimeout(admin.listTopics(), 3000);
    return { status: "ok" as const };
  } catch (error) {
    return { status: "down" as const, error: getErrorMessage(error) };
  } finally {
    try {
      await admin.disconnect();
    } catch {
      // No-op: health checks should report the original failure.
    }
  }
}

async function checkAiService() {
  if (!env.aiServiceUrl) {
    return { status: "degraded" as const, error: "AI_SERVICE_URL not configured" };
  }

  try {
    const response = await withTimeout(fetch(`${env.aiServiceUrl}/health`), 3000);
    return response.ok
      ? { status: "ok" as const }
      : { status: "down" as const, error: `AI service returned ${response.status}` };
  } catch (error) {
    return { status: "down" as const, error: getErrorMessage(error) };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Timed out")), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error";
}
