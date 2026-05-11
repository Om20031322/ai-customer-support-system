import { prisma } from "../prisma/client";

const apiResponseTimes: number[] = [];
let redisHits = 0;
let redisMisses = 0;

export function recordApiResponseTime(durationMs: number) {
  apiResponseTimes.push(durationMs);

  if (apiResponseTimes.length > 500) {
    apiResponseTimes.shift();
  }
}

export function recordRedisHit() {
  redisHits += 1;
}

export function recordRedisMiss() {
  redisMisses += 1;
}

export async function getSystemMetrics() {
  const [totalTickets, processedTickets, failedTickets, retryAggregate, dlqCount] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "PROCESSED" } }),
      prisma.ticket.count({ where: { status: "FAILED" } }),
      prisma.ticket.aggregate({ _sum: { retryCount: true } }),
      prisma.failedTicket.count()
    ]);

  const totalRedisRequests = redisHits + redisMisses;
  const averageApiResponseMs =
    apiResponseTimes.length === 0
      ? 0
      : Math.round(
          apiResponseTimes.reduce((total, value) => total + value, 0) /
            apiResponseTimes.length
        );

  return {
    totalTickets,
    processedTickets,
    failedTickets,
    retryCount: retryAggregate._sum.retryCount ?? 0,
    dlqCount,
    redis: {
      hits: redisHits,
      misses: redisMisses,
      hitRate:
        totalRedisRequests === 0 ? 0 : Number((redisHits / totalRedisRequests).toFixed(4))
    },
    api: {
      averageResponseMs: averageApiResponseMs,
      samples: apiResponseTimes.length
    }
  };
}
