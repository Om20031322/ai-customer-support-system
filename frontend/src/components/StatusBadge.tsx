type Props = {
  value: string;
  type?: "status" | "category";
};

const statusStyles: Record<string, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-700",
  processing: "border-amber-200 bg-amber-50 text-amber-700",
  processed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  open: "border-blue-200 bg-blue-50 text-blue-700"
};

export function StatusBadge({ value, type = "status" }: Props) {
  const normalizedValue = value.toLowerCase();
  const style =
    type === "status"
      ? statusStyles[normalizedValue] ?? "border-slate-200 bg-slate-50 text-slate-700"
      : "border-cyan-200 bg-cyan-50 text-cyan-700";

  return (
    <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold capitalize ${style}`}>
      {formatBadgeValue(value)}
    </span>
  );
}

function formatBadgeValue(value: string) {
  return value.replace(/_/g, " ").toLowerCase();
}
