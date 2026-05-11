import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { recordApiResponseTime } from "../services/metricsService";
import { logger } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  const requestId = getRequestId(req);

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const elapsedMs = Date.now() - startedAt;
    recordApiResponseTime(elapsedMs);
    logger.info(
      "[API]",
      `${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`,
      { requestId }
    );
  });

  next();
}

function getRequestId(req: Request) {
  const incoming = req.header("x-request-id");
  return incoming?.trim() || crypto.randomUUID();
}
