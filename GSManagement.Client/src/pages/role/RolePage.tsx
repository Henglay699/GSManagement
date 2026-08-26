import { useEffect, useState } from "react";
import RoleTable from "../../components/role/RoleTable";
import Role from "../../models/role";
import { fetchRoles } from "../../services/roleservice";
import axios from "axios";
import {
  Search,
  Plus,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

function RolePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>();

  // Pagination states
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Delete modal states
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const loadRoles = async () => {
      setLoading(true);
      try {
        const data = await fetchRoles(pageNumber, pageSize, searchTerm);
        setRoles(data.items ?? []);
        setTotalCount(data.totalCount ?? 0);
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

    const timer = setTimeout(loadRoles, 300); // Debounce search requests
    return () => clearTimeout(timer);
  }, [pageNumber, pageSize, searchTerm]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/role/${roleToDelete.id}`);
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      setRoleToDelete(null);
    } catch (error) {
      console.error("Failed to delete role:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2">
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 tracking-tight">
                Role Management
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                <Sparkles size={10} /> Access Control
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure system roles, permissions, and security scope
            </p>
          </div>
        </div>

        <Link to={"/role/create"}>
          <button className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs rounded-xl transition-all shadow-xs hover:shadow-sm">
            <Plus size={15} />
            <span>Add Role</span>
          </button>
        </Link>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Toolbar Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageNumber(1);
              }}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Total Roles:{" "}
            <span className="font-bold text-slate-800">{totalCount}</span>
          </div>
        </div>

        {/* Dynamic Content Views */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
            <span className="text-xs font-medium">Fetching roles...</span>
          </div>
        ) : errorMessage != null ? (
          <div className="py-12 text-center text-xs font-medium text-rose-500">
            {errorMessage}
          </div>
        ) : roles.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No roles matched your query.
          </div>
        ) : (
          <>
            <RoleTable
              roles={roles}
              onDelete={(role) => setRoleToDelete(role)}
            />

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

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Delete Role Definition
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800">
                    {roleToDelete.roleName}
                  </span>
                  ? Associated users will lose this role's permission scope.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Role</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolePage;
