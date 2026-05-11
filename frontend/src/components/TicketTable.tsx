import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Ticket } from "../types/ticket";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

type Props = {
  tickets: Ticket[];
};

export function TicketTable({ tickets }: Props) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded border border-line bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-panel">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                Retries
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="cursor-pointer transition hover:bg-teal-50/60"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/tickets/${ticket.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td className="max-w-sm px-5 py-4">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="font-semibold text-teal-800 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {ticket.subject}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {ticket.description}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm">
                  <div className="font-semibold">{ticket.name}</div>
                  <div className="text-slate-500">{ticket.email}</div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={ticket.status} />
                </td>
                <td className="px-5 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge value={ticket.category} type="category" />
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                  {ticket.retryCount ?? 0}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                  {formatDate(ticket.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tickets.length === 0 && (
        <div className="px-4 py-10 text-center text-sm text-slate-500">
          No tickets submitted yet.
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
