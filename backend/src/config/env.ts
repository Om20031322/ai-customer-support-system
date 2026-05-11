import "dotenv/config";

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.JWT_SECRET === "change-this-demo-secret"
) {
  throw new Error("JWT_SECRET must be set to a production-safe value");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  frontendUrl: process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:3000",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  redisUrl: process.env.REDIS_URL,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM,
  kafkaClientId: process.env.KAFKA_CLIENT_ID ?? "customer-support-backend",
  kafkaBrokers: (process.env.KAFKA_BROKERS ?? "localhost:29092")
    .split(",")
    .map((broker) => broker.trim())
    .filter(Boolean),
  kafkaTicketCreatedTopic:
    process.env.KAFKA_TICKET_CREATED_TOPIC ?? "tickets.created",
  kafkaTicketProcessedTopic:
    process.env.KAFKA_TICKET_PROCESSED_TOPIC ?? "tickets.processed",
  kafkaTicketRetryTopic:
    process.env.KAFKA_TICKET_RETRY_TOPIC ?? "tickets.retry",
  kafkaTicketDeadLetterTopic:
    process.env.KAFKA_TICKET_DEAD_LETTER_TOPIC ?? "tickets.dead-letter"
};
