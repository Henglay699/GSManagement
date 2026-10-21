import { useCallback, useState } from "react";
import RoleTable from "../../components/role/RoleTable";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAsync } from "../../hooks/useAsync";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { deleteRole, fetchRoles } from "../../services/roleService";
import type { Role } from "../../types/role";
import {
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";

const PAGE_SIZE = 10;

function RolePage() {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [pageNumber, setPageNumber] = useState(1);

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data,
    loading,
    error: errorMessage,
    setError,
    reload,
  } = useAsync(
    useCallback(
      () => fetchRoles(pageNumber, PAGE_SIZE, debouncedSearch),
      [pageNumber, debouncedSearch],
    ),
    "An unexpected error occurred",
  );

  const roles = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRole(roleToDelete.id);
      setRoleToDelete(null);
      await reload();
    } catch (error) {
      setRoleToDelete(null);
      setError(getErrorMessage(error, "Failed to delete role."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
                Role Management
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900">
                <Sparkles size={10} /> Access Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Configure system roles, permissions, and security scope
            </p>
          </div>
        </div>

        {hasPermission(Permission.CreateRole) && (
          <Link
            to={paths.roleCreate}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs rounded-xl transition-all shadow-xs hover:shadow-sm"
          >
            <Plus size={15} />
            <span>Add Role</span>
          </Link>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 overflow-hidden">
        {/* Toolbar Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/40 dark:bg-zinc-800/40 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500 shadow-2xs"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1);
              }}
            />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
            Total Roles:{" "}
            <span className="font-bold text-slate-800 dark:text-zinc-100">{totalCount}</span>
          </div>
        </div>

        {/* Dynamic Content Views */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-xs font-medium">Fetching roles...</span>
          </div>
        ) : errorMessage ? (
          <div className="py-12 text-center text-xs font-medium text-rose-500 dark:text-rose-400">
            {errorMessage}
          </div>
        ) : roles.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
            No roles matched your query.
          </div>
        ) : (
          <>
            <RoleTable
              roles={roles}
              onDelete={setRoleToDelete}
            />

            {/* Pagination Footer */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-800/30 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <div>
                Page{" "}
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {pageNumber}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs text-slate-600 dark:text-zinc-300"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="p-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs text-slate-600 dark:text-zinc-300"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {roleToDelete && (
        <ConfirmDialog
          title="Delete Role Definition"
          message={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {roleToDelete.roleName}
              </span>
              ? Associated users will lose this role's permission scope.
            </>
          }
          confirmLabel="Delete Role"
          busy={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setRoleToDelete(null)}
        />
      )}
    </div>
  );
}

export default RolePage;