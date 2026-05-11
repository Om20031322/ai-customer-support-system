import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message =
    statusCode === 500 && env.nodeEnv === "production"
      ? "Internal server error"
      : error.message;

  if (statusCode === 500) {
    logger.error("[API]", "Unhandled error", {
      requestId: req.requestId,
      message: error.message,
      stack: env.nodeEnv === "production" ? undefined : error.stack
    });
  }

  res.status(statusCode).json({
    error: {
      message,
      statusCode
    }
  });
}
