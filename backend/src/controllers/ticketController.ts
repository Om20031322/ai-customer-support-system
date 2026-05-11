import { NextFunction, Request, Response } from "express";
import {
  createTicket,
  getTicketById,
  listTickets,
  updateTicketStatusByAdmin
} from "../services/ticketService";
import { AppError } from "../middleware/errorHandler";

export async function createTicketHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication token is required", 401);
    }

    const ticket = await createTicket(req.body, req.user);
    res.status(201).json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function listTicketsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication token is required", 401);
    }

    const tickets = await listTickets(req.user);
    res.status(200).json({ data: tickets });
  } catch (error) {
    next(error);
  }
}

export async function getTicketByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Authentication token is required", 401);
    }

    const ticket = await getTicketById(req.params.id, req.user);
    res.status(200).json({ data: ticket });
  } catch (error) {
    next(error);
  }
}

export async function updateTicketStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ticket = await updateTicketStatusByAdmin(req.params.id, req.body?.status);
    res.status(200).json({ data: ticket });
  } catch (error) {
    next(error);
  }
}
