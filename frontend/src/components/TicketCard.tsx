import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import type { Ticket } from "../types/ticket";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  ticket: Ticket;
};

export function TicketCard({ ticket }: Props) {
  return (
    <Link to={`/tickets/${ticket.id}`} className="panel block p-4 transition hover:border-teal-200 hover:bg-teal-50/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold text-teal-800">
            {ticket.subject}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ticket.description}</p>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge value={ticket.status} />
        <StatusBadge value={ticket.category} type="category" />
        {(ticket.retryCount ?? 0) > 0 && (
          <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
            {ticket.retryCount} retries
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span className="font-medium text-slate-700">{ticket.name}</span>
        <span className="inline-flex items-center gap-1">
          <CalendarClock size={15} />
          {formatDate(ticket.createdAt)}
        </span>
      </div>
    </Link>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
