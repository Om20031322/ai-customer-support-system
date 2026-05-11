import { Activity, AlertTriangle, Flame, Inbox } from "lucide-react";
import { AnalyticsCard } from "../components/AnalyticsCard";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { CategoryChart } from "../components/charts/CategoryChart";
import { PriorityChart } from "../components/charts/PriorityChart";
import { StatusChart } from "../components/charts/StatusChart";
import { useAnalytics } from "../hooks/useAnalytics";
import type { ChartDatum } from "../types/ticket";

export function Analytics() {
  const { summary, isLoading, error, refreshAnalytics } = useAnalytics();

  if (isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (error || !summary) {
    return (
      <div className="panel flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <span>{error ?? "Analytics are unavailable."}</span>
        <button type="button" className="secondary-button border-red-200 bg-white" onClick={refreshAnalytics}>
          Retry
        </button>
      </div>
    );
  }

  const statusData = buildStatusData(summary.byStatus);
  const processedTickets = getCount(statusData, "PROCESSED");
  const urgentTickets = getCount(summary.byPriority, "urgent");
  const failedTickets = getCount(statusData, "FAILED");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">Ticket distribution by AI triage output.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard title="Total Tickets" value={summary.totalTickets} icon={<Inbox size={20} />} />
        <AnalyticsCard title="Processed" value={processedTickets} icon={<Activity size={20} />} />
        <AnalyticsCard title="Urgent" value={urgentTickets} icon={<Flame size={20} />} />
        <AnalyticsCard title="Failed" value={failedTickets} icon={<AlertTriangle size={20} />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <StatusChart data={statusData} />
        <PriorityChart data={summary.byPriority} />
        <CategoryChart data={summary.byCategory} />
      </div>
    </section>
  );
}

function buildStatusData(items: ChartDatum[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const name = normalizeStatus(item.name);
    counts.set(name, (counts.get(name) ?? 0) + item.value);
  }

  return ["NEW", "PROCESSING", "PROCESSED", "FAILED"].map((name) => ({
    name,
    value: counts.get(name) ?? 0
  }));
}

function normalizeStatus(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "OPEN") {
    return "NEW";
  }

  return normalized;
}

function getCount(items: ChartDatum[], name: string) {
  return items.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ?? 0;
}
