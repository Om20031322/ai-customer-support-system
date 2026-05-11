import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client";
import { markTicketFailedFromDlq } from "./ticketService";

export type DeadLetterPayload = {
  ticketId?: unknown;
  id?: unknown;
  retryCount?: unknown;
  lastError?: unknown;
  category?: unknown;
  priority?: unknown;
  aiResponse?: unknown;
};

export async function saveFailedTicket(payload: DeadLetterPayload) {
  const ticket = await markTicketFailedFromDlq(payload);
  const failedTicket = await prisma.failedTicket.create({
    data: {
      ticketId: ticket.id,
      originalPayload: toPrismaJson(payload),
      errorMessage: getErrorMessage(payload),
      retryCount: getRetryCount(payload)
    }
  });

  console.log("[DLQ] Failed ticket saved");

  return { ticket, failedTicket };
}

export async function listFailedTickets() {
  const failedTickets = await prisma.failedTicket.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  console.log("[DLQ] Admin fetched failed tickets");

  return failedTickets;
}

function toPrismaJson(payload: DeadLetterPayload): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
}

function getErrorMessage(payload: DeadLetterPayload) {
  return typeof payload.lastError === "string" && payload.lastError.trim()
    ? payload.lastError.trim()
    : "Ticket processing failed";
}

function getRetryCount(payload: DeadLetterPayload) {
  if (typeof payload.retryCount === "number" && Number.isFinite(payload.retryCount)) {
    return payload.retryCount;
  }

  if (typeof payload.retryCount === "string" && payload.retryCount.trim()) {
    const parsed = Number(payload.retryCount);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}
