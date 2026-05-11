ALTER TABLE "Ticket"
ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastError" TEXT,
ADD COLUMN "processedAt" TIMESTAMP(3),
ADD COLUMN "failedAt" TIMESTAMP(3);

CREATE TABLE "FailedTicket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "originalPayload" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedTicket_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FailedTicket"
ADD CONSTRAINT "FailedTicket_ticketId_fkey"
FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
