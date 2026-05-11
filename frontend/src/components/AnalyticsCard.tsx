import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  icon: ReactNode;
  helperText?: string;
};

export function AnalyticsCard({ title, value, icon, helperText }: Props) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
          {helperText && <p className="mt-2 text-sm text-slate-500">{helperText}</p>}
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-cyan-50 text-cyan-700">
          {icon}
        </div>
      </div>
    </div>
  );
}
