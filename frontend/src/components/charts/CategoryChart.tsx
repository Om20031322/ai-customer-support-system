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
import type { ReactNode } from "react";
import type { ChartDatum } from "../../types/ticket";

const colors = ["#0f766e", "#0891b2", "#f59e0b", "#dc2626", "#64748b"];

type Props = {
  data: ChartDatum[];
};

export function CategoryChart({ data }: Props) {
  return (
    <ChartFrame title="Tickets by Category" isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_entry, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function ChartFrame({
  title,
  isEmpty,
  children
}: {
  title: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="panel p-4 shadow-sm">
      <h3 className="mb-3 font-bold">{title}</h3>
      {isEmpty ? (
        <div className="grid h-[260px] place-items-center text-sm text-slate-500">
          No category data yet.
        </div>
      ) : (
        children
      )}
    </div>
  );
}
