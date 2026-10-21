import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import AuthCard, {
  AuthError,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "../components/auth/AuthCard";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/api";
import { paths } from "../lib/paths";

function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Where RequireAuth sent the user from, so they land back there after login.
  const from = (location.state as { from?: string } | null)?.from ?? paths.users;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (status === "authenticated") return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard title="Sign in" onSubmit={handleSubmit}>
      {errorMessage && <AuthError>{errorMessage}</AuthError>}

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

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className={`${authLabelClass} mb-0`}>
            Password
          </label>
          <Link
            to={paths.forgotPassword}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          className={authInputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" disabled={submitting} className={authButtonClass}>
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        <span>Sign in</span>
      </button>
    </AuthCard>
  );
}

export default LoginPage;
