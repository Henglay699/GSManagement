import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import UserTable from "../../components/user/UserTable";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAsync } from "../../hooks/useAsync";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useUserHub } from "../../hooks/useUserHub";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { deleteUser, fetchUsers } from "../../services/userService";
import type { User } from "../../types/user";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";

const ITEMS_PER_PAGE = 12; // 3 rows x 4 columns

type StatusFilter = "all" | "active" | "inactive";

function UserPage() {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, setData, loading, error, setError, reload } = useAsync(
    useCallback(
      () => fetchUsers(currentPage, ITEMS_PER_PAGE, debouncedSearch),
      [currentPage, debouncedSearch],
    ),
    "An unexpected error occurred",
  );

  useUserHub({
    onCreated: reload,
    onUpdated: (updated) =>
      setData(
        (prev) =>
          prev && {
            ...prev,
            items: prev.items.map((u) => (u.id === updated.id ? updated : u)),
          },
      ),
    onDeleted: (deletedId) =>
      setData(
        (prev) =>
          prev && {
            ...prev,
            items: prev.items.filter((u) => u.id !== deletedId),
            totalCount: prev.totalCount - 1,
          },
      ),
  });

  const users = useMemo(() => data?.items ?? [], [data]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      await reload();
    } catch (err) {
      setUserToDelete(null);
      setError(getErrorMessage(err, "Failed to delete user."));
    } finally {
      setIsDeleting(false);
    }
  };

  // Status is filtered client-side on the current page.
  const filteredUsers = useMemo(() => {
    if (statusFilter === "active")
      return users.filter((u) => u.isActive !== false);
    if (statusFilter === "inactive")
      return users.filter((u) => u.isActive === false);
    return users;
  }, [users, statusFilter]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  return (
    <div className="max-w-[1400px] mx-auto space-y-3 p-2">
      <div className="border-b border-slate-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-500 dark:text-zinc-400 overflow-x-auto">
          <h1 className="text-slate-900 dark:text-zinc-100 border-b-2 text-[22px] border-slate-900 dark:border-zinc-100 pb-1 flex items-center gap-1.5">
            Total Users{" "}
            <span className="bg-slate-900 dark:bg-zinc-700 text-white text-[11px] px-1.5 rounded-full">
              {totalCount}
            </span>
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
        {/* Toolbar */}
        <div className="p-2.5 border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative w-86">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
              />
              <input
                type="text"
                className="w-full pl-8 pr-9 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                placeholder="Search username or email..."
                value={searchTerm}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSearchTerm(e.target.value);
                }}
              />
            </div>

            <div className="relative flex items-center">
              <Filter
                size={13}
                className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="pl-7 pr-6 py-1 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="all">Status: All</option>
                <option value="active">Status: Active</option>
                <option value="inactive">Status: Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPermission(Permission.CreateUser) && (
              <Link
                to={paths.userCreate}
                className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs rounded-lg transition-all shadow-xs"
              >
                <Plus size={14} />
                <span>Add staff</span>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-500 mb-2" />
            <span className="text-xs">Loading staff...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs font-medium text-rose-500 dark:text-rose-400">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500">
            No users match the current filter.
          </div>
        ) : (
          <>
            <UserTable users={filteredUsers} onDelete={setUserToDelete} />

            <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Showing{" "}
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {Math.min(startIndex + ITEMS_PER_PAGE, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {totalCount}
                </span>{" "}
                staff
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>

                <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium px-1">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {userToDelete && (
        <ConfirmDialog
          title="Delete Staff Member"
          message={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {userToDelete.userName}
              </span>
              ?
            </>
          }
          confirmLabel="Delete"
          busy={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
}

export default UserPage;
