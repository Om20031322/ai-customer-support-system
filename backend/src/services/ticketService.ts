import { Prisma, Role, Ticket, TicketStatus } from "@prisma/client";
import { publishTicketCreated } from "../kafka/producer";
import type { AuthUser } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../prisma/client";
import { getCachedJson, invalidateTicketCaches, setCachedJson } from "./cacheService";
import {
  sendTicketFailedEmail,
  sendTicketProcessedEmail,
  sendTicketSubmittedEmail
} from "./emailService";
import { emitTicketCreated, emitTicketUpdated } from "../socket/socket";

type CreateTicketPayload = {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  description?: unknown;
  status?: unknown;
  category?: unknown;
  priority?: unknown;
  aiResponse?: unknown;
};

const requiredStringFields = ["name", "email", "subject", "description"] as const;
const ticketStatuses = Object.values(TicketStatus);

export async function createTicket(payload: CreateTicketPayload, user: AuthUser) {
  const data = buildCreateTicketData(payload, user.id);

  const ticket = await prisma.ticket.create({
    data
  });

  await invalidateTicketCaches(ticket.userId);
  emitTicketCreated(ticket);
  await sendTicketSubmittedEmail(ticket);

  try {
    await publishTicketCreated({
      id: ticket.id,
      name: ticket.name,
      email: ticket.email,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      category: ticket.category,
      priority: ticket.priority,
      retryCount: ticket.retryCount,
      lastError: ticket.lastError,
      correlationId: ticket.id,
      createdAt: ticket.createdAt.toISOString()
    });

    const processingTicket = await updateTicketStatus(ticket.id, "PROCESSING");
    await invalidateTicketCaches(processingTicket.userId);
    emitTicketUpdated(processingTicket);

    return processingTicket;
  } catch (error) {
    const failedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        lastError: "Kafka publishing failed",
        aiResponse:
          "Ticket was saved, but the backend could not publish it to Kafka for AI processing."
      }
    });
    await invalidateTicketCaches(failedTicket.userId);
    emitTicketUpdated(failedTicket);
    await sendTicketFailedEmail(failedTicket);
    throw new AppError("Ticket was saved but Kafka publishing failed.", 502);
  }
}

export async function listTickets(user: AuthUser) {
  const cacheKey = user.role === Role.ADMIN ? "tickets:all" : `tickets:user:${user.id}`;
  const cached = await getCachedJson<Ticket[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const tickets = await prisma.ticket.findMany({
    where:
      user.role === Role.ADMIN
        ? undefined
        : {
            userId: user.id
          },
    orderBy: {
      createdAt: "desc"
    }
  });

  await setCachedJson(cacheKey, tickets, 30);

  return tickets;
}

type ProcessedTicketPayload = {
  ticketId?: unknown;
  status?: unknown;
  category?: unknown;
  priority?: unknown;
  aiResponse?: unknown;
  retryCount?: unknown;
  lastError?: unknown;
};

export async function updateTicketFromProcessing(payload: ProcessedTicketPayload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Processed ticket payload must be a JSON object", 400);
  }

  if (!isNonEmptyString(payload.ticketId)) {
    throw new AppError("ticketId is required", 400);
  }

  const status = normalizeStatus(payload.status, "PROCESSED");
  const isProcessed = status === "PROCESSED";
  const isFailed = status === "FAILED";

  const ticket = await prisma.ticket.update({
    where: {
      id: payload.ticketId.trim()
    },
    data: {
      status,
      category: optionalString(payload.category) ?? "general",
      priority: optionalString(payload.priority) ?? "medium",
      aiResponse: optionalString(payload.aiResponse) ?? null,
      retryCount: optionalNumber(payload.retryCount) ?? 0,
      lastError: optionalString(payload.lastError) ?? null,
      processedAt: isProcessed ? new Date() : undefined,
      failedAt: isFailed ? new Date() : undefined
    }
  });

  await invalidateTicketCaches(ticket.userId);

  if (ticket.status === "PROCESSED") {
    await sendTicketProcessedEmail(ticket);
  }

  if (ticket.status === "FAILED") {
    await sendTicketFailedEmail(ticket);
  }

  return ticket;
}

type FailedTicketPayload = {
  ticketId?: unknown;
  id?: unknown;
  status?: unknown;
  category?: unknown;
  priority?: unknown;
  aiResponse?: unknown;
  retryCount?: unknown;
  lastError?: unknown;
};

export async function markTicketFailedFromDlq(payload: FailedTicketPayload) {
  const ticketId = getPayloadTicketId(payload);
  const retryCount = optionalNumber(payload.retryCount) ?? 0;
  const lastError = optionalString(payload.lastError) ?? "Ticket processing failed";

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "FAILED",
      category: optionalString(payload.category) ?? "general",
      priority: optionalString(payload.priority) ?? "medium",
      aiResponse:
        optionalString(payload.aiResponse) ??
        "AI processing failed after all retry attempts.",
      retryCount,
      lastError,
      failedAt: new Date()
    }
  });

  await invalidateTicketCaches(ticket.userId);
  await sendTicketFailedEmail(ticket);

  return ticket;
}

export async function markTicketRetryFromKafka(payload: FailedTicketPayload) {
  const ticketId = getPayloadTicketId(payload);
  const retryCount = optionalNumber(payload.retryCount) ?? 0;
  const lastError = optionalString(payload.lastError) ?? null;

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "PROCESSING",
      retryCount,
      lastError
    }
  });

  await invalidateTicketCaches(ticket.userId);

  return ticket;
}

export async function getTicketById(id: string, user: AuthUser) {
  const ticket = await prisma.ticket.findUnique({
    where: { id }
  });

  if (!ticket) {
    throw new AppError("Ticket not found", 404);
  }

  if (user.role !== Role.ADMIN && ticket.userId !== user.id) {
    throw new AppError("Ticket not found", 404);
  }

  return ticket;
}

export async function updateTicketStatusByAdmin(id: string, status: unknown) {
  const normalizedStatus = parseRequiredStatus(status);
  let ticket;

  try {
    ticket = await updateTicketStatus(id, normalizedStatus);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError("Ticket not found", 404);
    }

    throw error;
  }

  await invalidateTicketCaches(ticket.userId);
  if (ticket.status === "PROCESSED") {
    await sendTicketProcessedEmail(ticket);
  }
  if (ticket.status === "FAILED") {
    await sendTicketFailedEmail(ticket);
  }
  emitTicketUpdated(ticket);

  return ticket;
}

function buildCreateTicketData(
  payload: CreateTicketPayload,
  userId: string
): Prisma.TicketCreateInput {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Request body must be a JSON object", 400);
  }

  for (const field of requiredStringFields) {
    if (!isNonEmptyString(payload[field])) {
      throw new AppError(`${field} is required`, 400);
    }
  }

  if (!isValidEmail(payload.email as string)) {
    throw new AppError("email must be a valid email address", 400);
  }

  return {
    name: (payload.name as string).trim(),
    email: (payload.email as string).trim().toLowerCase(),
    subject: (payload.subject as string).trim(),
    description: (payload.description as string).trim(),
    status: normalizeStatus(payload.status, "NEW"),
    category: optionalString(payload.category) ?? "general",
    priority: optionalString(payload.priority) ?? "medium",
    aiResponse: optionalString(payload.aiResponse),
    user: {
      connect: { id: userId }
    }
  };
}

async function updateTicketStatus(id: string, status: TicketStatus) {
  const data: Prisma.TicketUpdateInput = { status };

  if (status === "PROCESSED") {
    data.processedAt = new Date();
  }

  if (status === "FAILED") {
    data.failedAt = new Date();
  }

  return prisma.ticket.update({
    where: { id },
    data
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value: unknown): string | undefined {
  return isNonEmptyString(value) ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function getPayloadTicketId(payload: FailedTicketPayload) {
  if (isNonEmptyString(payload.ticketId)) {
    return payload.ticketId.trim();
  }

  if (isNonEmptyString(payload.id)) {
    return payload.id.trim();
  }

  throw new AppError("ticketId is required", 400);
}

function normalizeStatus(value: unknown, fallback: TicketStatus): TicketStatus {
  const normalized = optionalString(value)?.toUpperCase();
  return ticketStatuses.includes(normalized as TicketStatus)
    ? (normalized as TicketStatus)
    : fallback;
}

function parseRequiredStatus(value: unknown): TicketStatus {
  const normalized = optionalString(value)?.toUpperCase();

  if (!ticketStatuses.includes(normalized as TicketStatus)) {
    throw new AppError(
      `status must be one of: ${ticketStatuses.join(", ")}`,
      400
    );
  }

  return normalized as TicketStatus;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
