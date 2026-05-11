import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Activity, Database, Gauge, RadioTower, RefreshCw, Server, Wifi } from "lucide-react";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { fetchSystemHealth, fetchSystemMetrics } from "../services/api";
import type { DependencyHealth, SystemHealth, SystemMetrics } from "../types/ticket";

export function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setIsLoading(true);
    setError(null);

    try {
      const [healthData, metricsData] = await Promise.all([
        fetchSystemHealth(),
        fetchSystemMetrics()
      ]);
      setHealth(healthData);
      setMetrics(metricsData);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to load system status."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton rows={4} />;
  }

  if (error || !health) {
    return (
      <div className="panel flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <span>{error ?? "System status is unavailable."}</span>
        <button type="button" className="secondary-button border-red-200 bg-white" onClick={loadStatus}>
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Runtime health, dependency checks, and platform metrics.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={loadStatus}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <HealthCard title="Backend" icon={<Server size={19} />} check={{ status: health.status }} />
        <HealthCard title="Postgres" icon={<Database size={19} />} check={health.postgres} />
        <HealthCard title="Redis" icon={<Activity size={19} />} check={health.redis} />
        <HealthCard title="Kafka" icon={<RadioTower size={19} />} check={health.kafka} />
        <HealthCard title="AI Service" icon={<Wifi size={19} />} check={health.aiService} />
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tickets" value={metrics.totalTickets} />
          <Metric label="Processed" value={metrics.processedTickets} />
          <Metric label="Failed" value={metrics.failedTickets} />
          <Metric label="DLQ" value={metrics.dlqCount} />
          <Metric label="Retries" value={metrics.retryCount} />
          <Metric label="Redis Hit Rate" value={`${Math.round(metrics.redis.hitRate * 100)}%`} />
          <Metric label="Avg API Time" value={`${metrics.api.averageResponseMs}ms`} />
          <Metric label="Uptime" value={formatUptime(health.uptime)} />
        </div>
      )}
    </section>
  );
}

function HealthCard({
  title,
  icon,
  check
}: {
  title: string;
  icon: ReactNode;
  check: Pick<DependencyHealth, "status" | "error">;
}) {
  const style =
    check.status === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : check.status === "degraded"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-lg font-bold capitalize text-ink">{check.status}</p>
          {check.error && <p className="mt-2 text-xs text-slate-500">{check.error}</p>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded border ${style}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Gauge size={16} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function formatUptime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes}m`;
}
