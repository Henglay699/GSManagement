import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync";
import { fetchPermissions } from "../../services/permissionService";
import type { Permission } from "../../types/permission";
import type { Role, RoleFormData } from "../../types/role";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  KeyRound,
  Layers,
  Loader2,
  Minus,
  Search,
  Shield,
  X,
} from "lucide-react";

interface RoleFormProps {
  title: string;
  subtitle: string;
  backTo: string;
  initialData?: Role;
  onSubmit: (data: RoleFormData) => Promise<void>;
  isSubmitting: boolean;
  buttonText: string;
  errorMessage?: string;
}

const sameIds =(a: number[], b: number[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

function RoleForm({
  title,
  subtitle,
  backTo,
  initialData,
  onSubmit,
  isSubmitting,
  buttonText,
  errorMessage,
}: RoleFormProps) {
  const initialName = initialData?.roleName || "";
  const initialDescription = initialData?.description || "";
  const initialIds = useMemo(
    () => initialData?.permissions?.map((p) => p.id) || [],
    [initialData],
  );

  const [roleName, setRoleName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(initialIds);
  const [query, setQuery] = useState("");

  const { data: permissions = [], loading: loadingPerms } = useAsync(
    useCallback(() => fetchPermissions(), []),
    "Failed to load permissions.",
  );

  const selected = useMemo(() => new Set(selectedPermissionIds), [selectedPermissionIds]);

  const groupedPermissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
      const mod = perm?.module || "General";
      if (q && !perm.permissionName.toLowerCase().includes(q) && !mod.toLowerCase().includes(q)) {
        return acc;
      }
      (acc[mod] ??= []).push(perm);
      return acc;
    }, {});
  }, [permissions, query]);

  const isDirty =
    roleName.trim() !== initialName.trim() ||
    description.trim() !== initialDescription.trim() ||
    !sameIds(selectedPermissionIds, initialIds);

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Select / clear a set of permissions (a module, or everything shown).
  const setMany = (perms: Permission[], on: boolean) => {
    const ids = perms.map((p) => p.id);
    setSelectedPermissionIds((prev) =>
      on ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)),
    );
  };

  const visible = Object.values(groupedPermissions).flat();
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    onSubmit({
      roleName: roleName.trim(),
      description: description.trim(),
      permissionIds: selectedPermissionIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Pinned flush under the top bar (solid, so nothing shows through) to keep Save in reach. */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-4 flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 shadow-xs md:-mx-6 md:-mt-6 md:px-6 dark:border-line dark:bg-[#0b0c0e]">
        <Link
          to={backTo}
          className="rounded-xl border border-slate-200 bg-surface p-1.5 text-fg-2 shadow-2xs transition-colors hover:bg-slate-50 dark:border-line-strong dark:hover:bg-zinc-800"
          aria-label="Back to roles"
        >
          <ChevronLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold leading-tight tracking-tight text-slate-800 dark:text-white">
            {roleName.trim() || title}
          </h1>
          <p className="truncate text-[11px] text-fg-2">{subtitle}</p>
        </div>

        {isDirty && !isSubmitting && (
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 sm:inline-flex dark:bg-amber-950/40 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Unsaved changes
          </span>
        )}
        <Link
          to={backTo}
          className="rounded-xl border border-slate-200 bg-surface px-4 py-2 text-xs font-medium text-fg-2 transition-colors hover:bg-slate-50 dark:border-line-strong dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || !roleName.trim() || (!!initialData && !isDirty)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Check size={13} /> {buttonText}
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-400" />
          <div>
            <p className="font-semibold">Unable to save role</p>
            <p className="mt-0.5 text-rose-600 dark:text-rose-400">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Left: role details (stays in view on wide screens) */}
        <div className="space-y-4 lg:sticky lg:top-[68px]">
          <section className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-xs dark:border-line">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Shield size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Role details</h2>
                <p className="text-[11px] text-fg-2">Name and purpose of this role</p>
              </div>
            </div>

            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-fg-2">
              Role name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. HR Officer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-fg transition-all placeholder:text-fg-3 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-line-strong dark:bg-subtle dark:focus:bg-zinc-800"
            />

            <div className="mb-1.5 mt-4 flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-fg-2">
                Description
              </label>
              <span className="text-[10px] text-fg-3">{description.length}/500</span>
            </div>
            <textarea
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this role responsible for?"
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs text-fg transition-all placeholder:text-fg-3 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-line-strong dark:bg-subtle dark:focus:bg-zinc-800"
            />
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-surface p-5 shadow-xs dark:border-line">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-2">Access scope</p>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">
                  {selectedPermissionIds.length}
                  <span className="text-sm font-medium text-fg-3"> / {permissions.length}</span>
                </p>
              </div>
              <span className="text-[11px] text-fg-2">permissions</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-subtle">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${permissions.length ? (selectedPermissionIds.length / permissions.length) * 100 : 0}%`,
                }}
              />
            </div>
          </section>
        </div>

        {/* Right: permissions */}
        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-surface shadow-xs dark:border-line">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-line">
            <div className="mr-auto">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                <KeyRound size={15} className="text-indigo-500" /> Permissions
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  {selectedPermissionIds.length} selected
                </span>
              </h2>
              <p className="mt-0.5 text-[11px] text-fg-2">Grouped by module</p>
            </div>

            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search permissions"
                className="w-48 rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-3 text-xs text-fg placeholder:text-fg-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-line-strong dark:bg-subtle"
              />
            </div>
            <button
              type="button"
              disabled={visible.length === 0}
              onClick={() => setMany(visible, !allVisibleSelected)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-fg-2 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-line-strong dark:hover:bg-zinc-800"
            >
              {allVisibleSelected ? "Clear all" : "Select all"}
            </button>
          </div>

          <div className="space-y-3 p-4">
            {loadingPerms ? (
              <div className="flex flex-col items-center justify-center py-16 text-fg-3">
                <Loader2 size={22} className="mb-2 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-medium">Loading permissions...</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-xs text-fg-3">
                {query ? (
                  <>
                    No permissions match “{query}”.
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"
                    >
                      <X size={12} /> Clear search
                    </button>
                  </>
                ) : (
                  "No permissions available."
                )}
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                const count = perms.filter((p) => selected.has(p.id)).length;
                const all = count === perms.length;
                const some = count > 0 && !all;

                return (
                  <div
                    key={moduleName}
                    className="overflow-hidden rounded-xl border border-slate-200 dark:border-line"
                  >
                    <button
                      type="button"
                      onClick={() => setMany(perms, !all)}
                      className="flex w-full items-center gap-2.5 bg-slate-50/80 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100/80 dark:bg-subtle dark:hover:bg-zinc-800"
                      title={all ? "Clear this module" : "Select this module"}
                    >
                      <CheckBox state={all ? "on" : some ? "some" : "off"} />
                      <Layers size={13} className="text-indigo-500" />
                      <span className="flex-1 truncate text-[11px] font-bold uppercase tracking-wide text-slate-800 dark:text-white">
                        {moduleName}
                      </span>
                      <span className="text-[10px] font-medium text-fg-3">
                        {count}/{perms.length}
                      </span>
                    </button>

                    <div className="grid grid-cols-1 gap-1.5 p-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {perms.map((perm) => {
                        const on = selected.has(perm.id);
                        return (
                          <button
                            type="button"
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[11px] transition-all ${
                              on
                                ? "border-indigo-200 bg-indigo-50/80 font-medium text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                                : "border-slate-200/80 text-fg-2 hover:border-slate-300 hover:bg-slate-50 dark:border-line-strong dark:hover:bg-zinc-800"
                            }`}
                          >
                            <CheckBox state={on ? "on" : "off"} />
                            <span className="truncate">{perm.permissionName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </form>
  );
}

function CheckBox({ state }: { state: "on" | "some" | "off" }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${
        state === "off"
          ? "border-slate-300 bg-surface dark:border-zinc-600"
          : "border-indigo-600 bg-indigo-600 text-white"
      }`}
    >
      {state === "on" && <Check size={10} />}
      {state === "some" && <Minus size={10} />}
    </span>
  );
}

export default RoleForm;
