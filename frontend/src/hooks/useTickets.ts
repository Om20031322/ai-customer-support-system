import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchTickets } from "../services/api";
import { socket } from "../services/socket";
import type { Ticket } from "../types/ticket";

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTickets();
      setTickets(data);
    } catch {
      setError("Unable to load tickets. Make sure the backend API is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();

    function handleCreated(ticket: Ticket) {
      setTickets((currentTickets) => {
        if (currentTickets.some((item) => item.id === ticket.id)) {
          return currentTickets;
        }

        return [ticket, ...currentTickets];
      });
    }

    function handleUpdated(updatedTicket: Ticket) {
      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        )
      );
    }

    function handleProcessed(updatedTicket: Ticket) {
      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        )
      );
    }

    function handleConnect() {
      setIsConnected(true);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("ticket:created", handleCreated);
    socket.on("ticket:updated", handleUpdated);
    socket.on("ticket:processed", handleProcessed);
    socket.on("ticket:failed", handleUpdated);
    socket.on("ticket:retried", handleUpdated);
    socket.on("ticket:dlq", handleUpdated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("ticket:created", handleCreated);
      socket.off("ticket:updated", handleUpdated);
      socket.off("ticket:processed", handleProcessed);
      socket.off("ticket:failed", handleUpdated);
      socket.off("ticket:retried", handleUpdated);
      socket.off("ticket:dlq", handleUpdated);
    };
  }, [loadTickets]);

  const categories = useMemo(
    () => Array.from(new Set(tickets.map((ticket) => ticket.category))).sort(),
    [tickets]
  );

  const priorities = useMemo(
    () => Array.from(new Set(tickets.map((ticket) => ticket.priority))).sort(),
    [tickets]
  );

  const statuses = useMemo(
    () => Array.from(new Set(tickets.map((ticket) => ticket.status))).sort(),
    [tickets]
  );

  return {
    tickets,
    categories,
    priorities,
    statuses,
    isConnected,
    isLoading,
    error,
    refreshTickets: loadTickets
  };
}
