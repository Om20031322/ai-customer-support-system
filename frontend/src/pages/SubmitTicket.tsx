import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { createTicket } from "../services/api";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  description: ""
};

export function SubmitTicket() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        name: current.name || user.name,
        email: current.email || user.email
      }));
    }
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      await createTicket(form);
      setForm({
        ...initialForm,
        name: user?.name ?? "",
        email: user?.email ?? ""
      });
      setIsSuccess(true);
      setMessage("Processing ticket...");
      toast.success("Ticket submitted successfully.");
    } catch {
      setIsSuccess(false);
      setMessage("Ticket submission failed. Check the backend service and try again.");
      toast.error("Ticket submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form className="panel p-5" onSubmit={handleSubmit}>
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Submit Ticket</h2>
          <p className="mt-1 text-sm text-slate-500">
            New tickets are queued for AI triage as soon as they are saved.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">Name</span>
            <input
              className="field"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            <span className="label">Email</span>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="label">Subject</span>
          <input
            className="field"
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
            required
          />
        </label>
        <label className="mt-4 block">
          <span className="label">Description</span>
          <textarea
            className="field min-h-40 resize-y"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            required
          />
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="button min-w-36" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {isSubmitting ? "Submitting" : "Submit Ticket"}
          </button>
          {message && (
            <p
              className={`rounded border px-3 py-2 text-sm font-semibold ${
                isSuccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
              {isSuccess && (
                <Link className="ml-2 underline" to="/dashboard">
                  View dashboard
                </Link>
              )}
            </p>
          )}
        </div>
      </form>
      <aside className="panel p-5">
        <h3 className="text-lg font-bold">Processing Flow</h3>
        <ol className="mt-4 space-y-3 text-sm text-slate-600">
          <li className="rounded border border-line bg-panel p-3">Ticket saved in PostgreSQL</li>
          <li className="rounded border border-line bg-panel p-3">Backend publishes Kafka event</li>
          <li className="rounded border border-line bg-panel p-3">AI service classifies and replies</li>
          <li className="rounded border border-line bg-panel p-3">Dashboard updates through Socket.IO</li>
        </ol>
      </aside>
    </section>
  );
}
