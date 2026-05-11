import http from "http";
import app from "./app";
import { env } from "./config/env";
import { connectRedis, disconnectRedis } from "./config/redis";
import { disconnectProcessedTicketConsumer, startProcessedTicketConsumer } from "./kafka/consumer";
import { disconnectProducer } from "./kafka/producer";
import { prisma } from "./prisma/client";
import { initializeSocket } from "./socket/socket";
import { logger } from "./utils/logger";

const server = http.createServer(app);

initializeSocket(server);

connectRedis().catch((error) => {
  console.error("[Redis] Startup connection failed", error);
});

server.listen(env.port, () => {
  logger.info("[API]", `Backend server running on port ${env.port}`);
  logger.info("[Docker]", "Service healthy");
});

console.log("[Kafka] Starting backend processed-ticket consumer from server.ts");
startProcessedTicketConsumer().catch((error) => {
  console.error("Failed to start Kafka processed-ticket consumer", error);
});

async function shutdown() {
  logger.warn("[Docker]", "Service restarting");
  logger.info("[API]", "Shutting down backend server");
  server.close(async () => {
    await disconnectProcessedTicketConsumer();
    await disconnectProducer();
    await disconnectRedis();
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
