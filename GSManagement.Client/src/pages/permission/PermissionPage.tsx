import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  KeyRound,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  FileText,
  Calendar,
  Lock,
} from "lucide-react";
import axios from "axios";
import Permission from "../../models/permission";
import { fetchPermissions } from "../../services/permissionservice";
import formatDate from "../../utils/datetimeformater";

function PermissionPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("All");
  const [errorMessage, setErrorMessage] = useState<string>();

  // Pagination states
  const [pageNumber, setPageNumber] = useState<number>(1);
  const pageSize = 10;

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      try {
        const data = await fetchPermissions();
        setPermissions(data ?? []);
        setErrorMessage(undefined);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage("Backend server can't be reached.");
        } else {
          setErrorMessage("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

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
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Permission Management
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                <Lock size={10} /> System Read-Only
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse available system rights, access keys, and functional scope
              definitions
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Toolbar & Filter Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
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
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            >
              {modules.map((mod) => (
                <option key={mod} value={mod}>
                  {mod === "All" ? "All Modules" : mod}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Total System Permissions:{" "}
            <span className="font-bold text-slate-800">{totalCount}</span>
          </div>
        </div>

        {/* Dynamic Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-medium">
              Fetching permission schema...
            </span>
          </div>
        ) : errorMessage != null ? (
          <div className="py-12 text-center text-xs font-medium text-rose-500">
            {errorMessage}
          </div>
        ) : paginatedPermissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No permissions match your filter criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[10px] uppercase text-slate-400 font-bold tracking-wider border-b border-slate-100">
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
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedPermissions.map((perm) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Permission Title & Key */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
                            <KeyRound size={15} />
                          </div>
                          <div>
                            <Link
                              to={`/permission/detail/${perm.id}`}
                              className="!no-underline font-semibold text-slate-800 hover:text-indigo-600 text-xs transition-colors font-mono"
                            >
                              {perm.permissionName}
                            </Link>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: #{perm.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Module Tag */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Layers size={11} className="text-indigo-500" />
                          {perm.module || "General"}
                        </span>
                      </td>

                      {/* Functional Scope Description */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <FileText
                            size={13}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="truncate text-xs">
                            {perm.description || "No description assigned"}
                          </span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Calendar
                            size={13}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="font-medium">
                            {formatDate(perm.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Detail View Button */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <Link
                          to={`/permission/detail/${perm.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium"
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
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs text-slate-500">
              <div>
                Page{" "}
                <span className="font-semibold text-slate-700">
                  {pageNumber}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs text-slate-600"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs text-slate-600"
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
