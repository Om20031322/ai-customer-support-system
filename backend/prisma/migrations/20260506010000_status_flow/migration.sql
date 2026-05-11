ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'NEW';

UPDATE "Ticket"
SET "status" = CASE
  WHEN lower("status") = 'open' THEN 'NEW'
  WHEN lower("status") = 'processed' THEN 'PROCESSED'
  WHEN lower("status") = 'processing' THEN 'PROCESSING'
  WHEN lower("status") = 'failed' THEN 'FAILED'
  ELSE upper("status")
END;
