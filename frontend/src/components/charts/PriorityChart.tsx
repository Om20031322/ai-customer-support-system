import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartDatum } from "../../types/ticket";

const priorityColors: Record<string, string> = {
  urgent: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#059669"
};

type Props = {
  data: ChartDatum[];
};

export function PriorityChart({ data }: Props) {
  return (
    <div className="panel p-4 shadow-sm">
      <h3 className="mb-3 font-bold">Tickets by Priority</h3>
      {data.length === 0 ? (
        <div className="grid h-[260px] place-items-center text-sm text-slate-500">
          No priority data yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={priorityColors[entry.name.toLowerCase()] ?? "#64748b"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
