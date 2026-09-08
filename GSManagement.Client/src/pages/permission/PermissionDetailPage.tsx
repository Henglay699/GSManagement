import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  KeyRound,
  Calendar,
  Layers,
  FileText,
  Loader2,
  Lock,
  Code2,
  Info,
} from "lucide-react";
import axios from "axios";
import Permission from "../../models/permission";
import { formatDate } from "../../utils/datetimeformater";

function PermissionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const loadPermissionDetail = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Permission>(`/api/permission/${id}`);
        setPermission(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.message ||
              "Failed to load permission details.",
          );
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPermissionDetail();
    }
  }, [id]);

  return (
    <div className="w-full space-y-4 p-2">
      {/* Header Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/permissions"
            className="p-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            title="Back to Permissions"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
                Permission Details
              </h1>
              <span className="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                ID: {id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Read-only view of developer-managed system capability
              specifications
            </p>
          </div>
        </div>

        {/* Read-Only System Badge */}
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl text-xs font-medium">
          <Lock size={13} className="text-amber-600 dark:text-amber-400" />
          <span>Managed by System Developer</span>
        </div>
      </div>

      {/* Content State Handling */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
          <span className="text-xs font-medium">
            Loading permission configuration...
          </span>
        </div>
      ) : errorMessage ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-12 text-center text-xs text-rose-500 dark:text-rose-400 font-medium">
          {errorMessage}
        </div>
      ) : permission ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Primary Identity & System Status */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-5">
              {/* Permission Title */}
              <div className="flex items-start gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <KeyRound size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate font-mono">
                    {permission.permissionName}
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                    System Key
                  </p>
                </div>
              </div>

              {/* Module Scope */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Layers size={12} /> Target Module
                </span>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                    {permission.module}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-zinc-400">Module Scope</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <FileText size={12} /> Functional Scope
                </span>
                <p className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-50/70 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed">
                  {permission.description ||
                    "No description assigned for this permission."}
                </p>
              </div>

              {/* Created Date */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Calendar size={12} /> System Registration Date
                </span>
                <div className="text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-50/70 dark:bg-zinc-800/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                  {formatDate(permission.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Developer Code & System Context */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                <Code2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                  System Usage Reference
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Code implementation snippets for backend/frontend
                  authorization guards
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* React Guard Sample */}
              <div className="bg-slate-900 dark:bg-black rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-mono">
                    Frontend Authorization Check
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-400">
                    TSX / React
                  </span>
                </div>
                <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
                  <code>{`<HasPermission name="${permission.permissionName}">
  <Component />
</HasPermission>`}</code>
                </pre>
              </div>

              {/* Backend Guard Sample */}
              <div className="bg-slate-900 dark:bg-black rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-mono">
                    Backend Route Protection With ASP.NET CORE Web Api
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-400">
                    Middleware / API
                  </span>
                </div>
                <pre className="text-xs font-mono text-indigo-300 overflow-x-auto">
                  <code>{`[PermissionRequired(Policy = "${permission.permissionName}")]"`}</code>
                </pre>
              </div>

              {/* Notice Box */}
              <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3.5 flex items-start gap-2.5">
                <Info size={16} className="text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Permissions are hardcoded capabilities defined inside core
                  backend controllers. Modifying permission names directly in
                  production requires developer deployment.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PermissionDetailPage;