import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Shield,
  KeyRound,
  Calendar,
  Layers,
  FileText,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  LockKeyhole,
} from "lucide-react";
import axios from "axios";
import Role from "../../models/role";
import Permission from "../../models/permission";
import { formatDate } from "../../utils/datetimeformater";

function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const loadRoleDetail = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Role>(`/api/role/${id}`);
        setRole(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.message || "Failed to load role details.",
          );
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRoleDetail();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/role/${id}`);
      navigate("/roles");
    } catch (error) {
      console.error("Failed to delete role:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Group permissions by module
  const groupedPermissions =
    role?.permissions?.reduce<Record<string, Permission[]>>((acc, perm) => {
      const mod = perm?.module || "General";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(perm);
      return acc;
    }, {}) || {};

  return (
    <div className="w-full space-y-4 p-2">
      {/* Header Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/roles"
            className="p-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            title="Back to Roles"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
                Role Details
              </h1>
              <span className="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700">
                ID: #{id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              View configuration, permissions, and security metadata
            </p>
          </div>
        </div>

        {/* Action Controls */}
        {role && (
          <div className="flex items-center gap-2">
            <Link to={`/role/update/${role.id}`}>
              <button className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 font-semibold text-xs rounded-xl transition-all">
                <Edit size={14} />
                <span>Edit Role</span>
              </button>
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 font-semibold text-xs rounded-xl transition-all"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-12 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
          <span className="text-xs font-medium">
            Fetching role scope details...
          </span>
        </div>
      ) : errorMessage ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-12 text-center text-xs text-rose-500 dark:text-rose-400 font-medium">
          {errorMessage}
        </div>
      ) : role ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Role Metadata Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-5">
              {/* Role Title */}
              <div className="flex items-start gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100 truncate">
                    {role.roleName}
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                    System Role Identifier
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <FileText size={12} /> Description
                </span>
                <p className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-50/70 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed">
                  {role.description || "No description provided for this role."}
                </p>
              </div>

              {/* Created Date */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Calendar size={12} /> Assigned / Created At
                </span>
                <div className="text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-50/70 dark:bg-zinc-800/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-zinc-800">
                  {formatDate(role.createdAt)}
                </div>
              </div>

              {/* Summary Stats Badge */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <LockKeyhole size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                      Privilege Scope
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                      Active rights configured
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  {role.permissions?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Permission Matrix Breakdown */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                  <KeyRound size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                    Assigned Privileges
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Detailed permission capabilities mapped to this role
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
                {Object.keys(groupedPermissions).length} Module(s)
              </span>
            </div>

            {/* Permission Badges Grouped by Module */}
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                No active permissions assigned to this role.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedPermissions).map(
                  ([moduleName, perms]) => (
                    <div
                      key={moduleName}
                      className="bg-slate-50/50 dark:bg-zinc-800/40 rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 space-y-2.5"
                    >
                      {/* Module Title Header */}
                      <div className="flex items-center gap-2">
                        <Layers size={13} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
                          {moduleName}
                        </span>
                        <span className="text-[9px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 px-1.5 py-0.2 rounded-full font-bold">
                          {perms.length}
                        </span>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                        {perms.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-xs shadow-2xs"
                          >
                            <KeyRound
                              size={11}
                              className="text-indigo-500 dark:text-indigo-400 shrink-0"
                            />
                            <span className="truncate font-medium text-[11px]">
                              {perm.permissionName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && role && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 max-w-sm w-full shadow-xl border border-slate-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-xl shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                  Delete Role Definition
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {role.roleName}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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

export default RoleDetailPage;