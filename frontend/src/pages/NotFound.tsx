import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <section className="panel mx-auto max-w-xl p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded bg-red-50 text-red-700">
        <AlertCircle size={24} />
      </div>
      <h2 className="mt-4 text-2xl font-bold">Page not found</h2>
      <p className="mt-2 text-sm text-slate-500">
        The page may have moved, or your current role may not have access to it.
      </p>
      <Link to="/dashboard" className="button mt-5">
        Back to dashboard
      </Link>
    </section>
  );
}
