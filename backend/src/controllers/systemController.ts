import { NextFunction, Request, Response } from "express";
import { getHealthStatus } from "../services/healthService";
import { getSystemMetrics } from "../services/metricsService";

export async function healthHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const health = await getHealthStatus();
    res.status(health.status === "ok" ? 200 : 503).json(health);
  } catch (error) {
    next(error);
  }
}

export async function metricsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const metrics = await getSystemMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
}
