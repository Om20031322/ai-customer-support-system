type Props = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 4 }: Props) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="panel p-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
