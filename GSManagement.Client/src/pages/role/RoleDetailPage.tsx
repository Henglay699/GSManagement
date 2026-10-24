import { useCallback, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  FileText,
  KeyRound,
  Layers,
  Loader2,
  LockKeyhole,
  Pencil,
  Shield,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { deleteRole, fetchRoleById } from "../../services/roleService";
import type { Permission } from "../../types/permission";
import { formatDate } from "../../utils/dateTimeFormatter";
import { useAuth } from "../../context/AuthContext";
// Aliased: `Permission` here is already the permission row type.
import { ADMIN_ROLE, Permission as AppPermission } from "../../lib/permissions";

function RoleDetailPage() {
  const { hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const roleId = Number(id);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: role,
    loading,
    error: errorMessage,
    setError,
  } = useAsync(
    useCallback(() => fetchRoleById(roleId), [roleId]),
    "Failed to load role details.",
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRole(roleId);
      navigate(paths.roles);
    } catch (error) {
      setShowDeleteModal(false);
      setError(getErrorMessage(error, "Failed to delete role."));
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
      <div className="bg-surface p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-line flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={paths.roles}
            className="p-2 bg-slate-50 dark:bg-subtle border border-slate-200 dark:border-line-strong rounded-xl text-fg-2 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            title="Back to Roles"
          >
            <ChevronLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                Role Details
              </h1>
              <span className="text-[10px] font-mono font-semibold bg-slate-100 dark:bg-subtle text-fg-2 px-2 py-0.5 rounded-xl border border-slate-200 dark:border-line-strong">
                ID: #{id}
              </span>
            </div>
            <p className="text-xs text-fg-2 mt-0.5">
              View configuration, permissions, and security metadata
            </p>
          </div>
        </div>

        {/* Action Controls */}
        {role && (
          <div className="flex items-center gap-2">
            {hasPermission(AppPermission.UpdateRole) && (
              <Link
                to={paths.roleEdit(role.id)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 font-semibold text-xs rounded-xl transition-all"
              >
                <Pencil size={14} />
                <span>Edit Role</span>
              </Link>
            )}

            {hasPermission(AppPermission.DeleteRole) && role?.roleName !== ADMIN_ROLE && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 font-semibold text-xs rounded-xl transition-all"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 dark:border-line p-12 flex flex-col items-center justify-center text-fg-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
          <span className="text-xs font-medium">
            Fetching role scope details...
          </span>
        </div>
      ) : errorMessage ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 dark:border-line p-12 text-center text-xs text-rose-500 dark:text-rose-400 font-medium">
          {errorMessage}
        </div>
      ) : role ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Role Metadata Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-surface p-5 rounded-2xl border border-slate-200/80 dark:border-line shadow-xs space-y-5">
              {/* Role Title */}
              <div className="flex items-start gap-3 border-b border-line pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Shield size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {role.roleName}
                  </h2>
                  <p className="text-[11px] text-fg-3 dark:text-white0 font-mono mt-0.5">
                    System Role Identifier
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-3 dark:text-white0 flex items-center gap-1">
                  <FileText size={12} /> Description
                </span>
                <p className="text-xs text-fg-2 bg-slate-50/70 dark:bg-subtle p-3 rounded-xl border border-line leading-relaxed">
                  {role.description || "No description provided for this role."}
                </p>
              </div>

              {/* Created Date */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-fg-3 dark:text-white0 flex items-center gap-1">
                  <Calendar size={12} /> Assigned / Created At
                </span>
                <div className="text-xs font-medium text-fg-2 bg-slate-50/70 dark:bg-subtle px-3 py-2 rounded-xl border border-line">
                  {formatDate(role.createdAt)}
                </div>
              </div>

              {/* Summary Stats Badge */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-surface border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <LockKeyhole size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      Privilege Scope
                    </div>
                    <div className="text-[10px] text-fg-2">
                      Active rights configured
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-surface px-2.5 py-1 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                  {role.permissions?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Permission Matrix Breakdown */}
          <div className="lg:col-span-8 bg-surface p-5 rounded-2xl border border-slate-200/80 dark:border-line shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                  <KeyRound
                    size={14}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                    Assigned Privileges
                  </h3>
                  <p className="text-[10px] text-fg-3 dark:text-white0">
                    Detailed permission capabilities mapped to this role
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold bg-slate-100 dark:bg-subtle text-fg-2 px-2 py-0.5 rounded-full border border-slate-200 dark:border-line-strong">
                {Object.keys(groupedPermissions).length} Module(s)
              </span>
            </div>

            {/* Permission Badges Grouped by Module */}
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="py-12 text-center text-xs text-fg-3 dark:text-white0 font-medium">
                No active permissions assigned to this role.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedPermissions).map(
                  ([moduleName, perms]) => (
                    <div
                      key={moduleName}
                      className="bg-slate-50/50 dark:bg-subtle rounded-xl border border-slate-200/80 dark:border-line p-3.5 space-y-2.5"
                    >
                      {/* Module Title Header */}
                      <div className="flex items-center gap-2">
                        <Layers
                          size={13}
                          className="text-indigo-600 dark:text-indigo-400"
                        />
                        <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                          {moduleName}
                        </span>
                        <span className="text-[9px] bg-surface border border-slate-200 dark:border-line-strong text-fg-2 px-1.5 py-0.2 rounded-full font-bold">
                          {perms.length}
                        </span>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                        {perms.map((perm) => (
                          <div
                            key={perm.id}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border border-slate-200/80 dark:border-line-strong bg-surface text-fg-2 text-xs shadow-2xs"
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

      {showDeleteModal && role && (
        <ConfirmDialog
          title="Delete Role Definition"
          message={
            <>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-fg">
                {role.roleName}
              </span>
              ? This action cannot be undone.
            </>
          }
          confirmLabel="Delete Role"
          busy={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

export default RoleDetailPage;
