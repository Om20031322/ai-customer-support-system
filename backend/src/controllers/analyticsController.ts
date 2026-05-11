import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { getAnalyticsSummary } from "../services/analyticsService";

export async function getAnalyticsSummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication token is required", 401);
    }

    const summary = await getAnalyticsSummary(req.user);
    res.status(200).json({ data: summary });
  } catch (error) {
    next(error);
  }
}
