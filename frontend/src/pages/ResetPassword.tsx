import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound, Loader2 } from "lucide-react";
import { resetPassword } from "../services/api";
import { AuthShell } from "./Login";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    if (!token) {
      setError("Password reset token is missing.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token, newPassword: form.newPassword });
      toast.success("Password reset successfully.");
      navigate("/login", { replace: true });
    } catch {
      setError("Password reset failed. The link may be invalid or expired.");
      toast.error("Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Reset Password" subtitle="Choose a new password for your local account.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label>
          <span className="label">New Password</span>
          <input
            className="field"
            type="password"
            minLength={8}
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            required
          />
        </label>
        <label>
          <span className="label">Confirm Password</span>
          <input
            className="field"
            type="password"
            minLength={8}
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            required
          />
        </label>
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}
        <button className="button w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
          {isSubmitting ? "Resetting" : "Reset Password"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Need a new link?{" "}
          <Link className="font-semibold text-teal-700 hover:underline" to="/forgot-password">
            Request reset
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
