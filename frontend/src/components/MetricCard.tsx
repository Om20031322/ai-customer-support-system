import { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

export function MetricCard({ label, value, icon }: Props) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded bg-cyan-50 text-cyan-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

