import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Mail,
} from "lucide-react";
import AuthCard, {
  AuthError,
  AuthSuccess,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "../components/auth/AuthCard";
import { getErrorMessage } from "../lib/api";
import { paths } from "../lib/paths";
import { requestPasswordReset } from "../services/authService";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We'll email you a link to reset it"
      onSubmit={handleSubmit}
    >
      {errorMessage && <AuthError>{errorMessage}</AuthError>}

      {sent ? (
        // Deliberately vague: the app never reveals whether an email is registered.
        <AuthSuccess>
          If an account exists for <strong>{email}</strong>, we've sent a link
          to reset your password. It expires in 30 minutes, so check your
          inbox (and spam folder).
        </AuthSuccess>
      ) : (
        <>
          <div>
            <label htmlFor="email" className={authLabelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              className={authInputClass}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className={authButtonClass}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            <span>Send reset link</span>
          </button>
        </>
      )}

      <Link
        to={paths.login}
        className="flex items-center justify-center gap-1.5 text-sm font-medium text-fg-2 hover:text-indigo-600 dark:hover:text-indigo-400"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </AuthCard>
  );
}

export default ForgotPasswordPage;
