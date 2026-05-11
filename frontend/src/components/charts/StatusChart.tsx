import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import type { ChartDatum } from "../../types/ticket";

const statusColors: Record<string, string> = {
  NEW: "#2563eb",
  PROCESSING: "#d97706",
  PROCESSED: "#059669",
  FAILED: "#dc2626"
};

type Props = {
  data: ChartDatum[];
};

export function StatusChart({ data }: Props) {
  const visibleData = data.filter((item) => item.value > 0);

  return (
    <div className="panel p-4 shadow-sm">
      <h3 className="mb-3 font-bold">Processed vs Open Status</h3>
      {visibleData.length === 0 ? (
        <div className="grid h-[260px] place-items-center text-sm text-slate-500">
          No status data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={visibleData}
              dataKey="value"
              nameKey="name"
              outerRadius={88}
              label
            >
              {visibleData.map((entry) => (
                <Cell key={entry.name} fill={statusColors[entry.name] ?? "#64748b"} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
