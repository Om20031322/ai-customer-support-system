import { NextFunction, Request, Response } from "express";
import { listFailedTickets } from "../services/dlqService";

export async function listFailedTicketsHandler(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const failedTickets = await listFailedTickets();
    res.status(200).json({ data: failedTickets });
  } catch (error) {
    next(error);
  }
}
