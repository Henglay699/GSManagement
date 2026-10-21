import { ShieldOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Permission } from "../../lib/permissions";

// Shows the page only if the user has the permission. The backend enforces
// the same permission on its endpoints; this just avoids showing a page
// whose every request would fail with 403.
function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) return <NoAccess />;
  return children;
}

export function NoAccess() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShieldOff className="w-10 h-10 text-slate-400 dark:text-zinc-500 mb-3" />
      <h1 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
        No access
      </h1>
      <p className="text-sm text-slate-500 dark:text-zinc-400">
        You don't have permission to view this page. Ask an administrator if
        you need access.
      </p>
    </div>
  );
}

export default RequirePermission;
