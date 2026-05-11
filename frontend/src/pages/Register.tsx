import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { AuthShell } from "./Login";

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await register(form);
      toast.success("Account created.");
      navigate("/submit", { replace: true });
    } catch {
      setError("Registration failed. Use a unique email and a password with at least 8 characters.");
      toast.error("Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Register" subtitle="Create a customer account to submit and track tickets.">
      <form className="space-y-4" onSubmit={handleSubmit}>
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
        <label>
          <span className="label">Password</span>
          <input
            className="field"
            type="password"
            value={form.password}
            minLength={8}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        <button className="button w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
          {isSubmitting ? "Creating account" : "Create Account"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-semibold text-teal-700 hover:underline" to="/login">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
