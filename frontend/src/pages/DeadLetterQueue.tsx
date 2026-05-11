import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { fetchFailedTickets } from "../services/api";
import { socket } from "../services/socket";
import type { FailedTicket } from "../types/ticket";

export function DeadLetterQueue() {
  const [items, setItems] = useState<FailedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadFailedTickets() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchFailedTickets();
      setItems(data);
    } catch {
      setError("Unable to load dead letter queue.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFailedTickets();

    socket.on("ticket:dlq", loadFailedTickets);

    return () => {
      socket.off("ticket:dlq", loadFailedTickets);
    };
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Dead Letter Queue</h2>
          <p className="mt-1 text-sm text-slate-500">
            Permanently failed ticket processing events.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={loadFailedTickets}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {isLoading && <LoadingSkeleton rows={3} />}

      {error && (
        <div className="panel flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" className="secondary-button border-red-200 bg-white" onClick={loadFailedTickets}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded border border-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-panel">
                <tr>
                  <TableHeader>Ticket ID</TableHeader>
                  <TableHeader>Error Message</TableHeader>
                  <TableHeader>Retries</TableHeader>
                  <TableHeader>Created</TableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="max-w-xs break-all px-5 py-4 text-sm font-semibold text-teal-800">
                      {item.ticketId}
                    </td>
                    <td className="max-w-xl px-5 py-4 text-sm text-slate-700">
                      {item.errorMessage}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {item.retryCount}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-sm text-slate-500">
              <AlertTriangle size={22} />
              <span className="font-semibold text-slate-700">No failed tickets in DLQ.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TableHeader({ children }: { children: string }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
      {children}
    </th>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
