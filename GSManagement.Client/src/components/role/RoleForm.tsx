import React, { useCallback, useState } from "react";
import { useAsync } from "../../hooks/useAsync";
import { fetchPermissions } from "../../services/permissionService";
import type { Permission } from "../../types/permission";
import type { Role, RoleFormData } from "../../types/role";
import {
  AlertCircle,
  Check,
  FileText,
  KeyRound,
  Layers,
  Loader2,
  LockKeyhole,
  Shield,
} from "lucide-react";

interface RoleFormProps {
  initialData?: Role;
  onSubmit: (data: RoleFormData) => Promise<void>;
  isSubmitting: boolean;
  buttonText: string;
  errorMessage?: string;
}

function RoleForm({
  initialData,
  onSubmit,
  isSubmitting,
  buttonText,
  errorMessage,
}: RoleFormProps) {
  const [roleName, setRoleName] = useState<string>(initialData?.roleName || "");

  const [description, setDescription] = useState<string>(
    initialData?.description || "",
  );

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    initialData?.permissions?.map((p) => p.id) || [],
  );

  const { data: permissions = [], loading: loadingPerms } = useAsync(
    useCallback(() => fetchPermissions(), []),
    "Failed to load permissions.",
  );

  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>(
    (acc, perm) => {
      const mod = perm?.module || "General";

      if (!acc[mod]) {
        acc[mod] = [];
      }

      acc[mod].push(perm);

      return acc;
    },
    {},
  );

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleModulePermissions = (modulePerms: Permission[]) => {
    const moduleIds = modulePerms.map((p) => p.id);

    const allSelected = moduleIds.every((id) =>
      selectedPermissionIds.includes(id),
    );

    if (allSelected) {
      setSelectedPermissionIds((prev) =>
        prev.filter((id) => !moduleIds.includes(id)),
      );
    } else {
      setSelectedPermissionIds((prev) =>
        Array.from(new Set([...prev, ...moduleIds])),
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      return;
    }

    onSubmit({
      roleName: roleName.trim(),
      description: description.trim(),
      permissionIds: selectedPermissionIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col p-6 sm:p-8">
      {/* API Error */}
      {errorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-3 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle
            size={15}
            className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-400"
          />

          <div>
            <p className="font-semibold">Unable to save role</p>

            <p className="mt-0.5 text-rose-600 dark:text-rose-400">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.8fr)_minmax(420px,1.6fr)] gap-6">
        {/* =====================================================
            LEFT SIDE - ROLE INFORMATION
        ====================================================== */}
        <div className="space-y-5">
          {/* Section Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                <Shield
                  size={16}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                Role Information
              </h4>
            </div>

            <p className="text-[11px] text-fg-2 leading-relaxed">
              Define the identity and purpose of this security role.
            </p>
          </div>

          {/* Role Name */}
          <div>
            <label className="block text-[11px] font-semibold text-fg-2 uppercase tracking-wider mb-1.5">
              Role Name
            </label>

            <div className="relative">
              <Shield
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 dark:text-white0"
              />

              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Administrator"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50/70 dark:bg-subtle border border-slate-200 dark:border-line-strong rounded-xl text-xs text-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition-all placeholder:text-fg-3 dark:placeholder:text-white0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-fg-2 uppercase tracking-wider">
                Description
              </label>

              <span className="text-[9px] text-fg-3 dark:text-white0">
                {description.length}/500
              </span>
            </div>

            <div className="relative">
              <FileText
                size={14}
                className="absolute left-3 top-3 text-fg-3 dark:text-white0"
              />

              <textarea
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and responsibilities of this role..."
                rows={6}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50/70 dark:bg-subtle border border-slate-200 dark:border-line-strong rounded-xl text-xs text-fg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition-all placeholder:text-fg-3 dark:placeholder:text-white0"
              />
            </div>
          </div>

          {/* Permission Summary */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-2xl bg-surface border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
                <LockKeyhole
                  size={14}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-white">
                  Access Scope
                </p>

                <p className="text-[9px] text-fg-2">
                  Permissions assigned to this role
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface border border-slate-200 dark:border-line-strong rounded-2xl p-2.5">
                <p className="text-[9px] text-fg-3 dark:text-white0 uppercase font-semibold">
                  Assigned
                </p>

                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedPermissionIds.length}
                </p>
              </div>

              <div className="bg-surface border border-slate-200 dark:border-line-strong rounded-2xl p-2.5">
                <p className="text-[9px] text-fg-3 dark:text-white0 uppercase font-semibold">
                  Available
                </p>

                <p className="text-lg font-bold text-fg-2">
                  {permissions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE - PERMISSION MATRIX
        ====================================================== */}
        <div className="min-w-0">
          {/* Matrix Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Permission Matrix
                </h3>

                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 px-2 py-0.5 rounded-full font-semibold">
                  {selectedPermissionIds.length} selected
                </span>
              </div>

              <p className="text-[10px] text-fg-2 mt-0.5">
                Configure access by system module
              </p>
            </div>

            <KeyRound
              size={17}
              className="text-indigo-500 dark:text-indigo-400"
            />
          </div>

          {/* Scrollable Matrix */}
          <div className="h-[520px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
            {loadingPerms ? (
              <div className="h-full flex flex-col items-center justify-center text-fg-3 dark:text-white0">
                <Loader2
                  size={24}
                  className="animate-spin text-indigo-600 dark:text-indigo-400 mb-2"
                />

                <span className="text-xs font-medium">
                  Loading permission schemas...
                </span>
              </div>
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-fg-3 dark:text-white0">
                No permissions available.
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                const allSelected = perms.every((p) =>
                  selectedPermissionIds.includes(p.id),
                );

                const selectedCount = perms.filter((p) =>
                  selectedPermissionIds.includes(p.id),
                ).length;

                return (
                  <div
                    key={moduleName}
                    className="bg-surface rounded-xl border border-slate-200 dark:border-line shadow-2xs overflow-hidden"
                  >
                    {/* Module Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 dark:bg-subtle border-b border-slate-200 dark:border-line">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0">
                          <Layers
                            size={13}
                            className="text-indigo-600 dark:text-indigo-400"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wide truncate">
                              {moduleName}
                            </span>

                            <span className="text-[9px] bg-surface border border-slate-200 dark:border-line-strong text-fg-2 px-1.5 py-0.5 rounded-full font-semibold">
                              {perms.length}
                            </span>
                          </div>

                          <span className="text-[9px] text-fg-3 dark:text-white0">
                            {selectedCount} of {perms.length} selected
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleModulePermissions(perms)}
                        className={`shrink-0 text-[10px] font-semibold transition-colors ${
                          allSelected
                            ? "text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                            : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                        }`}
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    {/* Permissions */}
                    <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {perms.map((perm) => {
                        const isSelected = selectedPermissionIds.includes(
                          perm.id,
                        );

                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-2xl border text-[11px] cursor-pointer transition-all select-none ${
                              isSelected
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 font-medium"
                                : "bg-slate-50/30 dark:bg-subtle border-slate-200/80 dark:border-line-strong text-fg-2 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <KeyRound
                                size={12}
                                className={
                                  isSelected
                                    ? "text-indigo-600 dark:text-indigo-400 shrink-0"
                                    : "text-fg-3 dark:text-white0 shrink-0"
                                }
                              />

                              <span className="truncate">
                                {perm.permissionName}
                              </span>
                            </div>

                            <div
                              className={`w-4 h-4 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                                isSelected
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "border-slate-300 dark:border-zinc-600 bg-surface"
                              }`}
                            >
                              {isSelected && <Check size={10} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-line">
        <div className="text-[10px] text-fg-3 dark:text-white0">
          {selectedPermissionIds.length > 0 ? (
            <>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {selectedPermissionIds.length}
              </span>{" "}
              permission
              {selectedPermissionIds.length !== 1 ? "s" : ""} selected
            </>
          ) : (
            "No permissions selected"
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !roleName.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />

              <span>Saving...</span>
            </>
          ) : (
            <>
              <Shield size={13} />
              <span>{buttonText}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default RoleForm;
