import { Server } from "http";
import jwt from "jsonwebtoken";
import { Role, Ticket } from "@prisma/client";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env";

let io: SocketIOServer | null = null;

export function initializeSocket(server: Server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.corsOrigin,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== "string") {
      next(new Error("Authentication token is required"));
      return;
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret) as {
        sub: string;
        role: Role;
      };
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    if (socket.data.role === Role.ADMIN) {
      socket.join("admins");
    } else {
      socket.join(userRoom(socket.data.userId));
    }
  });

  return io;
}

export function emitTicketCreated(ticket: Ticket) {
  emitTicketEvent("ticket:created", ticket);
}

export function emitTicketUpdated(ticket: Ticket) {
  emitTicketEvent("ticket:updated", ticket);
}

export function emitTicketProcessed(ticket: Ticket) {
  emitTicketEvent("ticket:processed", ticket);
}

export function emitTicketFailed(ticket: Ticket) {
  emitTicketEvent("ticket:failed", ticket);
}

export function emitTicketRetried(ticket: Ticket) {
  emitTicketEvent("ticket:retried", ticket);
}

export function emitTicketMovedToDlq(ticket: Ticket) {
  emitTicketEvent("ticket:dlq", ticket);
}

function emitTicketEvent(
  event:
    | "ticket:created"
    | "ticket:updated"
    | "ticket:processed"
    | "ticket:failed"
    | "ticket:retried"
    | "ticket:dlq",
  ticket: Ticket
) {
  io?.to("admins").emit(event, ticket);
  io?.to("admins").emit("analytics:updated");

  if (ticket.userId) {
    io?.to(userRoom(ticket.userId)).emit(event, ticket);
  }
}

function userRoom(userId: string) {
  return `user:${userId}`;
}
