import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  UserRound
} from "lucide-react";
import { PriorityBadge } from "../components/PriorityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { useAuth } from "../auth/AuthContext";
import { fetchTicket, updateTicketStatus } from "../services/api";
import { socket } from "../services/socket";
import type { Ticket, TicketStatus } from "../types/ticket";

const editableStatuses: TicketStatus[] = ["NEW", "PROCESSING", "PROCESSED", "FAILED"];

export function TicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTicket() {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTicket(id);
      setTicket(data);
    } catch {
      setError("Unable to load ticket details.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTicket();

    function handleProcessed(updatedTicket: Ticket) {
      if (updatedTicket.id === id) {
        setTicket(updatedTicket);
      }
    }

    function handleUpdated(updatedTicket: Ticket) {
      if (updatedTicket.id === id) {
        setTicket(updatedTicket);
      }
    }

    socket.on("ticket:updated", handleUpdated);
    socket.on("ticket:processed", handleProcessed);
    socket.on("ticket:failed", handleUpdated);
    socket.on("ticket:retried", handleUpdated);
    socket.on("ticket:dlq", handleUpdated);

    return () => {
      socket.off("ticket:updated", handleUpdated);
      socket.off("ticket:processed", handleProcessed);
      socket.off("ticket:failed", handleUpdated);
      socket.off("ticket:retried", handleUpdated);
      socket.off("ticket:dlq", handleUpdated);
    };
  }, [id]);

  if (isLoading) {
    return <LoadingSkeleton rows={3} />;
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Link to="/dashboard" className="secondary-button">
          <ArrowLeft size={16} />
          Back
        </Link>
        <div className="panel border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error ?? "Ticket not found."}
        </div>
      </div>
    );
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!ticket) return;

    setIsUpdatingStatus(true);
    try {
      const updatedTicket = await updateTicketStatus(ticket.id, status);
      setTicket(updatedTicket);
      toast.success("Ticket status updated.");
    } catch {
      toast.error("Unable to update ticket status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <section className="space-y-4">
      <Link to="/dashboard" className="secondary-button">
        <ArrowLeft size={16} />
        Back
      </Link>
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{ticket.subject}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {ticket.name} - {ticket.email} - Created {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge value={ticket.category} type="category" />
          </div>
        </div>

        {user?.role === "ADMIN" && (
          <div className="mt-5 rounded border border-line bg-panel p-4">
            <label className="max-w-xs">
              <span className="label">Manage Status</span>
              <select
                className="field"
                value={ticket.status}
                disabled={isUpdatingStatus}
                onChange={(event) => handleStatusChange(event.target.value as TicketStatus)}
              >
                {editableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatValue(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-1">
            <div className="rounded border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-slate-700" />
                <h3 className="font-bold">Ticket Details</h3>
              </div>
              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <Detail label="Customer" value={ticket.name} />
                <Detail label="Email" value={ticket.email} />
                <Detail label="Subject" value={ticket.subject} />
                <Detail label="Created" value={formatDateTime(ticket.createdAt)} />
                <Detail label="Status" value={formatValue(ticket.status)} />
                <Detail label="Category" value={formatValue(ticket.category)} />
                <Detail label="Priority" value={formatValue(ticket.priority)} />
                <Detail label="Retry Count" value={String(ticket.retryCount ?? 0)} />
                {ticket.lastError && <Detail label="Last Error" value={ticket.lastError} />}
              </dl>
            </div>

            <div className="rounded border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <UserRound size={18} className="text-teal-700" />
                <h3 className="font-bold">Customer Message</h3>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {ticket.description}
              </p>
            </div>

            <div className="rounded border border-line bg-panel p-4">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-cyan-700" />
                <h3 className="font-bold">AI Response</h3>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {ticket.aiResponse ?? "Waiting for AI processing..."}
              </p>
            </div>
          </div>

          <div className="rounded border border-line bg-panel p-4">
            <h3 className="font-bold">Timeline</h3>
            <div className="mt-4 space-y-4">
              {buildTimeline(ticket).map((item) => (
                <TimelineItem
                  key={item.title}
                  title={item.title}
                  text={item.text}
                  state={item.state}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function TimelineItem({
  title,
  text,
  state
}: {
  title: string;
  text: string;
  state: "complete" | "active" | "pending" | "failed";
}) {
  const isComplete = state === "complete";
  const icon =
    state === "complete" ? (
      <CheckCircle2 size={18} />
    ) : state === "active" ? (
      <Clock size={18} />
    ) : (
      <Circle size={18} />
    );
  const style =
    state === "failed"
      ? "bg-red-50 text-red-700"
      : isComplete
        ? "bg-emerald-50 text-emerald-700"
        : state === "active"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-500";

  return (
    <div className="flex gap-3">
      <div
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${style}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm capitalize text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function buildTimeline(ticket: Ticket) {
  const status = ticket.status.toUpperCase();
  const kafkaFailed = status === "FAILED" && !ticket.aiResponse;
  const aiFailed = status === "FAILED" && Boolean(ticket.aiResponse);

  return [
    {
      title: "Ticket Created",
      text: formatDateTime(ticket.createdAt),
      state: "complete" as const
    },
    {
      title: "Sent to Kafka",
      text: kafkaFailed
        ? "Kafka publishing failed"
        : status === "NEW"
          ? "Waiting for backend publish"
          : "Ticket event published",
      state: kafkaFailed ? ("failed" as const) : status === "NEW" ? ("pending" as const) : ("complete" as const)
    },
    {
      title: "AI Processing",
      text:
        status === "PROCESSING"
          ? "AI service is classifying the request"
          : aiFailed
            ? "AI processing failed"
            : status === "PROCESSED"
              ? "AI service completed triage"
              : "Waiting for AI service",
      state:
        status === "PROCESSING"
          ? ("active" as const)
          : aiFailed
            ? ("failed" as const)
            : status === "PROCESSED"
              ? ("complete" as const)
              : ("pending" as const)
    },
    {
      title: "AI Response Generated",
      text: ticket.aiResponse ? "Response is available" : "No response yet",
      state: ticket.aiResponse && status === "PROCESSED" ? ("complete" as const) : ("pending" as const)
    },
    {
      title: "Ticket Processed",
      text: formatValue(ticket.status),
      state:
        status === "PROCESSED"
          ? ("complete" as const)
          : status === "FAILED"
            ? ("failed" as const)
            : ("pending" as const)
    }
  ];
}

function formatValue(value: string) {
  return value.replace(/_/g, " ").toLowerCase();
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
