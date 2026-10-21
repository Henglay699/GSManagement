import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import AuthCard, {
  AuthError,
  AuthSuccess,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "../components/auth/AuthCard";
import { getErrorMessage } from "../lib/api";
import { paths } from "../lib/paths";
import { resetPassword } from "../services/authService";

// Opened from the link in the password-reset email (?token=...).
function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Couldn't reset your password."));
    } finally {
      setSubmitting(false);
    }
  };

  const backToLogin = (
    <Link
      to={paths.login}
      className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
    >
      <ArrowLeft size={14} />
      Back to sign in
    </Link>
  );

  if (!token) {
    return (
      <AuthCard title="Reset password">
        <AuthError>
          This reset link is incomplete. Please use the link from your email,
          or request a new one.
        </AuthError>
        <Link to={paths.forgotPassword} className={authButtonClass}>
          Request a new link
        </Link>
        {backToLogin}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Choose a new password for your account"
      onSubmit={handleSubmit}
    >
      {errorMessage && <AuthError>{errorMessage}</AuthError>}

      {done ? (
        <>
          <AuthSuccess>
            Your password has been reset, and you've been signed out of other
            devices. You can now sign in with your new password.
          </AuthSuccess>
          <Link to={paths.login} className={authButtonClass}>
            Sign in
          </Link>
        </>
      ) : (
        <>
          <div>
            <label htmlFor="new-password" className={authLabelClass}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              autoComplete="new-password"
              autoFocus
              className={authInputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className={authLabelClass}>
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              className={authInputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className={authButtonClass}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            <span>Reset password</span>
          </button>
          {backToLogin}
        </>
      )}
    </AuthCard>
  );
}

export default ResetPasswordPage;
