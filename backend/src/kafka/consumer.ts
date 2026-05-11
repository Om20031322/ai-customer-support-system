import { EachMessagePayload } from "kafkajs";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { saveFailedTicket } from "../services/dlqService";
import {
  markTicketRetryFromKafka,
  updateTicketFromProcessing
} from "../services/ticketService";
import {
  emitTicketFailed,
  emitTicketMovedToDlq,
  emitTicketProcessed,
  emitTicketRetried,
  emitTicketUpdated
} from "../socket/socket";
import { kafka } from "./client";
import { logger } from "../utils/logger";

const consumer = kafka.consumer({
  groupId: "customer-support-backend-processors"
});

export async function startProcessedTicketConsumer() {
  await consumer.connect();
  console.log(
    `[Kafka] Backend consumer connected to brokers: ${env.kafkaBrokers.join(", ")}`
  );

  await consumer.subscribe({
    topic: env.kafkaTicketProcessedTopic,
    fromBeginning: false
  });
  await consumer.subscribe({
    topic: env.kafkaTicketRetryTopic,
    fromBeginning: false
  });
  await consumer.subscribe({
    topic: env.kafkaTicketDeadLetterTopic,
    fromBeginning: false
  });
  console.log(
    `[Kafka] Backend consumer subscribed to topics "${env.kafkaTicketProcessedTopic}", "${env.kafkaTicketRetryTopic}", "${env.kafkaTicketDeadLetterTopic}"`
  );

  await consumer.run({
    eachMessage: handleProcessedTicketMessage
  });

  console.log("Kafka processed-ticket consumer started");
}

export async function disconnectProcessedTicketConsumer() {
  await consumer.disconnect();
}

async function handleProcessedTicketMessage({ message, topic }: EachMessagePayload) {
  if (!message.value) {
    return;
  }

  const startedAt = Date.now();
  let correlationId = message.headers?.correlationId?.toString();

  try {
    const payload = JSON.parse(message.value.toString());
    correlationId =
      correlationId ||
      (typeof payload.correlationId === "string" ? payload.correlationId : undefined);

    if (topic === env.kafkaTicketRetryTopic) {
      await handleRetryTicket(payload);
      return;
    }

    if (topic === env.kafkaTicketDeadLetterTopic) {
      await handleDeadLetterTicket(payload);
      return;
    }

    logger.info(
      "[Kafka]",
      `Backend consumer received ticket-processed event for ticket ${payload.ticketId}`,
      { correlationId }
    );
    const ticket = await updateTicketFromProcessing(payload);
    if (ticket.status === "PROCESSED") {
      emitTicketProcessed(ticket);
    } else if (ticket.status === "FAILED") {
      emitTicketFailed(ticket);
    } else {
      emitTicketUpdated(ticket);
    }
  } catch (error) {
    if (error instanceof AppError) {
      logger.error("[Kafka]", `Invalid ticket event: ${error.message}`, { correlationId });
      return;
    }

    logger.error("[Kafka]", "Failed to process ticket Kafka message", {
      correlationId,
      error: error instanceof Error ? error.message : "unknown error"
    });
  } finally {
    logger.info("[Kafka]", `Processed ${topic} message in ${Date.now() - startedAt}ms`, {
      correlationId
    });
  }
}

async function handleRetryTicket(payload: Record<string, unknown>) {
  const ticketId = typeof payload.ticketId === "string" ? payload.ticketId : payload.id;
  console.log(`[Retry] Retrying ticket processing for ticket ${ticketId}`);
  const ticket = await markTicketRetryFromKafka(payload);
  emitTicketRetried(ticket);
}

async function handleDeadLetterTicket(payload: Record<string, unknown>) {
  const ticketId = typeof payload.ticketId === "string" ? payload.ticketId : payload.id;
  console.log(`[DLQ] Ticket moved to dead letter queue for ticket ${ticketId}`);
  const { ticket } = await saveFailedTicket(payload);
  emitTicketMovedToDlq(ticket);
}
