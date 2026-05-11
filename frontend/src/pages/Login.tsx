import { FormEvent, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import type { ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function Login() {
  const { googleLogin, login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
  const [form, setForm] = useState({
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
      await login(form);
      toast.success("Logged in successfully.");
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(destination ?? "/dashboard", { replace: true });
    } catch {
      setError("Invalid email or password.");
      toast.error("Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      toast.error("Google login failed.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await googleLogin(response.credential);
      toast.success("Logged in with Google.");
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(destination ?? "/dashboard", { replace: true });
    } catch {
      setError("Google login failed. Please try again.");
      toast.error("Google login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Login" subtitle="Access your support ticket workspace.">
      <form className="space-y-4" onSubmit={handleSubmit}>
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
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <div className="text-right">
          <Link className="text-sm font-semibold text-teal-700 hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        <button className="button w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
          {isSubmitting ? "Logging in" : "Login"}
        </button>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        {googleClientId ? (
          <div className="grid place-items-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google login failed. Please try again.");
                toast.error("Google login failed.");
              }}
              useOneTap={false}
            />
          </div>
        ) : (
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
            Google login is not configured.
          </div>
        )}
        <p className="text-center text-sm text-slate-500">
          New here?{" "}
          <Link className="font-semibold text-teal-700 hover:underline" to="/register">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md">
        <div className="panel p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
