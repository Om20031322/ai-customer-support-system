import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock, Inbox, Search, SlidersHorizontal } from "lucide-react";
import { AnalyticsCard } from "../components/AnalyticsCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { TicketCard } from "../components/TicketCard";
import { TicketTable } from "../components/TicketTable";
import { useAuth } from "../auth/AuthContext";
import { useTickets } from "../hooks/useTickets";

export function Dashboard() {
  const { user } = useAuth();
  const {
    tickets,
    categories,
    priorities,
    statuses,
    isConnected,
    isLoading,
    error,
    refreshTickets
  } = useTickets();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const processed = tickets.filter((ticket) => ticket.status === "PROCESSED").length;
  const failed = tickets.filter((ticket) => ticket.status === "FAILED").length;
  const retries = tickets.reduce((total, ticket) => total + (ticket.retryCount ?? 0), 0);
  const open = tickets.filter((ticket) =>
    ["NEW", "PROCESSING", "open"].includes(ticket.status)
  ).length;
  const filteredTickets = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        normalizedSearchTerm.length === 0 ||
        ticket.subject.toLowerCase().includes(normalizedSearchTerm) ||
        ticket.description.toLowerCase().includes(normalizedSearchTerm) ||
        ticket.email.toLowerCase().includes(normalizedSearchTerm);
      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "all" || ticket.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, priorityFilter, searchTerm, statusFilter, tickets]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">
            {user?.role === "ADMIN" ? "Admin Dashboard" : "My Dashboard"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {user?.role === "ADMIN"
              ? "All customer tickets and AI triage state."
              : "Your submitted tickets and AI triage state."}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-semibold">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {isConnected ? "Realtime connected" : "Realtime offline"}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          title={user?.role === "ADMIN" ? "Total Tickets" : "My Tickets"}
          value={tickets.length}
          icon={<Inbox size={20} />}
        />
        <AnalyticsCard title="Open Queue" value={open} icon={<Clock size={20} />} />
        <AnalyticsCard title="Processed" value={processed} icon={<Activity size={20} />} />
        <AnalyticsCard
          title="Failed"
          value={failed}
          icon={<AlertTriangle size={20} />}
          helperText={retries > 0 ? `${retries} total retries` : undefined}
        />
      </div>
      <div className="panel p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <label className="relative">
            <span className="label">Search</span>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 text-slate-400" size={17} />
            <input
              className="field pl-9"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search subject, email, or description"
            />
          </label>
          <label>
            <span className="label">Status</span>
            <select
              className="field"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Priority</span>
            <select
              className="field"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="all">All priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Category</span>
            <select
              className="field"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading && (
        <LoadingSkeleton rows={4} />
      )}

      {error && (
        <div className="panel flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" className="secondary-button border-red-200 bg-white" onClick={refreshTickets}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className={`${filteredTickets.length === 0 ? "hidden" : "hidden lg:block"}`}>
            <TicketTable tickets={filteredTickets} />
          </div>
          <div className="grid gap-4 lg:hidden">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
          {filteredTickets.length === 0 && (
            <div className="panel flex flex-col items-center justify-center gap-2 p-10 text-center text-sm text-slate-500">
              <SlidersHorizontal size={22} />
              <span className="font-semibold text-slate-700">
                {tickets.length === 0 ? "No tickets submitted yet." : "No tickets match the current filters."}
              </span>
              <span>
                {tickets.length === 0
                  ? "Submit a support ticket to start the AI triage flow."
                  : "Adjust search, category, or priority to widen the queue."}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").toLowerCase();
}
