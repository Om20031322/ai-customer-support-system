import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Mail } from "lucide-react";
import { forgotPassword } from "../services/api";
import { AuthShell } from "./Login";

const SUCCESS_MESSAGE = "If this email exists, reset instructions have been sent.";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await forgotPassword({ email });
      setMessage(SUCCESS_MESSAGE);
      toast.success("Reset instructions requested.");
    } catch {
      setMessage(SUCCESS_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Forgot Password" subtitle="Request a password reset for your local account.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label>
          <span className="label">Email</span>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        {message && (
          <div className="rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
            {message}
          </div>
        )}
        <button className="button w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
          {isSubmitting ? "Sending" : "Send Reset Link"}
        </button>
        <p className="text-center text-sm text-slate-500">
          Remembered it?{" "}
          <Link className="font-semibold text-teal-700 hover:underline" to="/login">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
