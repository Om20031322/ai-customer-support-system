import { Role, Ticket } from "@prisma/client";
import type { AuthUser } from "../middleware/auth";
import { prisma } from "../prisma/client";
import { getCachedJson, setCachedJson } from "./cacheService";

export async function getAnalyticsSummary(user: AuthUser) {
  const cacheKey =
    user.role === Role.ADMIN ? "analytics:global" : `analytics:user:${user.id}`;
  const cached = await getCachedJson<AnalyticsSummary>(cacheKey);

  if (cached) {
    return cached;
  }

  const where =
    user.role === Role.ADMIN
      ? undefined
      : {
          userId: user.id
        };

  const [totalTickets, byStatus, byCategory, byPriority, recentTickets] =
    await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ["status"],
        where,
        _count: {
          status: true
        }
      }),
      prisma.ticket.groupBy({
        by: ["category"],
        where,
        _count: {
          category: true
        }
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        where,
        _count: {
          priority: true
        }
      }),
      prisma.ticket.findMany({
        where,
        take: 5,
        orderBy: {
          createdAt: "desc"
        }
      })
    ]);

  const summary = {
    totalTickets,
    byStatus: byStatus.map((item) => ({
      name: item.status,
      value: item._count.status
    })),
    byCategory: byCategory.map((item) => ({
      name: item.category,
      value: item._count.category
    })),
    byPriority: byPriority.map((item) => ({
      name: item.priority,
      value: item._count.priority
    })),
    recentTickets
  };

  await setCachedJson(cacheKey, summary, 60);

  return summary;
}

type AnalyticsSummary = {
  totalTickets: number;
  byStatus: Array<{ name: string; value: number }>;
  byCategory: Array<{ name: string; value: number }>;
  byPriority: Array<{ name: string; value: number }>;
  recentTickets: Ticket[];
}
