import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  Search,
} from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { paths } from "../../lib/paths";
import { fetchPermissions } from "../../services/permissionService";
import { formatDate } from "../../utils/dateTimeFormatter";

function PermissionPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("All");

  // Pagination states
  const [pageNumber, setPageNumber] = useState<number>(1);
  const pageSize = 10;

  const {
    data: permissions = [],
    loading,
    error: errorMessage,
  } = useAsync(
    useCallback(() => fetchPermissions(), []),
    "An unexpected error occurred",
  );

  // Filter modules options
  const modules = [
    "All",
    ...Array.from(new Set(permissions.map((p) => p.module || "General"))),
  ];

  // Filtered dataset
  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch =
      perm.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.module?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule =
      selectedModule === "All" || (perm.module || "General") === selectedModule;

    return matchesSearch && matchesModule;
  });

  // Pagination logic
  const totalCount = filteredPermissions.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedPermissions = filteredPermissions.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize,
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2">
      {/* Top Header Card */}
      <div className="bg-surface p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-line flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                Permission Management
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                <Lock size={10} /> System Read-Only
              </span>
            </div>
            <p className="text-xs text-fg-2 mt-0.5">
              Browse available system rights, access keys, and functional scope
              definitions
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface rounded-2xl shadow-xs border border-slate-200/80 dark:border-line overflow-hidden">
        {/* Toolbar & Filter Bar */}
        <div className="p-3 border-b border-line bg-inset dark:bg-subtle flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 dark:text-white0 pointer-events-none"
              />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-slate-200 dark:border-line-strong rounded-xl text-xs text-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-fg-3 dark:placeholder:text-white0 shadow-2xs"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageNumber(1);
                }}
              />
            </div>

            {/* Module Filter Select */}
            <select
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                setPageNumber(1);
              }}
              className="py-1.5 px-3 bg-surface border border-slate-200 dark:border-line-strong rounded-xl text-xs text-fg-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            >
              {modules.map((mod) => (
                <option key={mod} value={mod}>
                  {mod === "All" ? "All Modules" : mod}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-fg-2 font-medium">
            Total System Permissions:{" "}
            <span className="font-bold text-slate-800 dark:text-white">
              {totalCount}
            </span>
          </div>
        </div>

        {/* Dynamic Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-fg-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-xs font-medium">
              Fetching permission schema...
            </span>
          </div>
        ) : errorMessage ? (
          <div className="py-12 text-center text-xs font-medium text-rose-500 dark:text-rose-400">
            {errorMessage}
          </div>
        ) : paginatedPermissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-fg-3 dark:text-white0 font-medium">
            No permissions match your filter criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-fg-2">
                <thead className="bg-slate-50/80 dark:bg-subtle text-[10px] uppercase text-fg-3 dark:text-white0 font-bold tracking-wider border-b border-line">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      Permission Key
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Target Module
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Functional Scope
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Registered At
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-line bg-surface">
                  {paginatedPermissions.map((perm) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800 transition-colors group"
                    >
                      {/* Permission Title & Key */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <KeyRound size={15} />
                          </div>
                          <div>
                            <Link
                              to={paths.permissionDetail(perm.id)}
                              className="font-semibold text-fg hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition-colors font-mono"
                            >
                              {perm.permissionName}
                            </Link>
                            <div className="text-[10px] text-fg-3 dark:text-white0 font-mono">
                              ID: #{perm.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Module Tag */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                          <Layers
                            size={11}
                            className="text-indigo-500 dark:text-indigo-400"
                          />
                          {perm.module || "General"}
                        </span>
                      </td>

                      {/* Functional Scope Description */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5 text-fg-2">
                          <FileText
                            size={13}
                            className="text-fg-3 dark:text-white0 shrink-0"
                          />
                          <span className="truncate text-xs">
                            {perm.description || "No description assigned"}
                          </span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-fg-2 text-xs">
                          <Calendar
                            size={13}
                            className="text-fg-3 dark:text-white0 shrink-0"
                          />
                          <span className="font-medium">
                            {formatDate(perm.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Detail View Button */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <Link
                          to={paths.permissionDetail(perm.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-fg-2 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors text-xs font-medium"
                          title="View Details"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-2.5 border-t border-line bg-slate-50/30 dark:bg-subtle flex items-center justify-between text-xs text-fg-2">
              <div>
                Page{" "}
                <span className="font-semibold text-fg-2">
                  {pageNumber}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-fg-2">
                  {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                  className="p-1 rounded-2xl border border-slate-200 dark:border-line-strong bg-surface hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs text-fg-2"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="p-1 rounded-2xl border border-slate-200 dark:border-line-strong bg-surface hover:bg-slate-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs text-fg-2"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PermissionPage;
