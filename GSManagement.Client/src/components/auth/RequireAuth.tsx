import { Navigate, useLocation } from "react-router-dom";
import {
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { paths } from "../../lib/paths";

// Renders its children only for a logged-in user; otherwise sends them to
// the login page, remembering where they were going.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <Navigate
        to={paths.login}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}

export default RequireAuth;
