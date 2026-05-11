import { useCallback, useEffect, useState } from "react";
import { fetchAnalyticsSummary } from "../services/api";
import { socket } from "../services/socket";
import type { AnalyticsSummary } from "../types/ticket";

export function useAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchAnalyticsSummary();
      setSummary(data);
    } catch {
      setError("Unable to load analytics. Make sure the backend API is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();

    socket.on("analytics:updated", loadSummary);
    socket.on("ticket:created", loadSummary);
    socket.on("ticket:failed", loadSummary);
    socket.on("ticket:retried", loadSummary);
    socket.on("ticket:dlq", loadSummary);

    return () => {
      socket.off("analytics:updated", loadSummary);
      socket.off("ticket:created", loadSummary);
      socket.off("ticket:failed", loadSummary);
      socket.off("ticket:retried", loadSummary);
      socket.off("ticket:dlq", loadSummary);
    };
  }, [loadSummary]);

  return {
    summary,
    isLoading,
    error,
    refreshAnalytics: loadSummary
  };
}
