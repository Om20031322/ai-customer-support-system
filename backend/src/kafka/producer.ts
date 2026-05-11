import { Producer } from "kafkajs";
import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { kafka } from "./client";

let producer: Producer | null = null;

export type TicketCreatedEvent = {
  id: string;
  name: string;
  email: string;
  subject: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  retryCount?: number;
  lastError?: string | null;
  correlationId?: string;
  createdAt: string;
};

export async function connectProducer() {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
    console.log(
      `[Kafka] Producer connected to brokers: ${env.kafkaBrokers.join(", ")}`
    );
  }
}

export async function publishTicketCreated(ticket: TicketCreatedEvent) {
  await connectProducer();
  const correlationId = ticket.correlationId ?? crypto.randomUUID();

  await producer?.send({
    topic: env.kafkaTicketCreatedTopic,
    messages: [
      {
        key: ticket.id,
        value: JSON.stringify({
          ...ticket,
          correlationId
        }),
        headers: {
          correlationId: Buffer.from(correlationId)
        }
      }
    ]
  });

  logger.info(
    "[Kafka]",
    `Published ticket-created event to topic "${env.kafkaTicketCreatedTopic}" for ticket ${ticket.id}`,
    { correlationId }
  );
}

export async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}
