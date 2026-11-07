import { useCallback, useMemo, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
  Pencil,
  Plus,
  Search,
  UserCog,
  UserX,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Alert from "../../components/ui/Alert";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ClientFormModal from "../../components/client/ClientFormModal";
import AssignOperatorsModal from "../../components/client/AssignOperatorsModal";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../lib/api";
import { Permission } from "../../lib/permissions";
import { deactivateClient, fetchClientOperators, fetchClients } from "../../services/clientService";
import type { Client, OperatorOption } from "../../types/client";

const PAGE_SIZE = 25;
type View = "mine" | "all" | "unassigned";

/** Days until a YYYY-MM-DD date (negative once past). */
function daysUntil(date: string): number {
  const today = new Date();
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = date.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - t) / 86_400_000);
}

function CdcBadge({ date }: { date?: string | null }) {
  if (!date) return <span className="text-fg-3">—</span>;
  const left = daysUntil(date);
  const tone =
    left < 0
      ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
      : left <= 30
        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`} title={`Valid until ${date}`}>
      {left < 0 ? "Expired" : left <= 30 ? `${left} days left` : date}
    </span>
  );
}

/**
 * Clients (factories) and who handles them. Operators see only the clients assigned to them;
 * the Operations Manager sees every client, spots unassigned ones and spreads the work.
 */
export default function ClientPage() {
  const { hasPermission } = useAuth();
  const seeAll = hasPermission(Permission.ViewAllClients);
  const canAssign = hasPermission(Permission.AssignClient);
  const canCreate = hasPermission(Permission.CreateClient);
  const canUpdate = hasPermission(Permission.UpdateClient);
  const canDelete = hasPermission(Permission.DeleteClient) && seeAll;

  const [view, setView] = useState<View>(seeAll ? "all" : "mine");
  const [operatorId, setOperatorId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Client | "new" | null>(null);
  const [assigning, setAssigning] = useState<Client | null>(null);
  const [deactivating, setDeactivating] = useState<Client | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const list = useAsync(
    useCallback(
      () =>
        fetchClients({
          search: debouncedSearch || undefined,
          scope: view === "mine" ? "mine" : "all",
          unassigned: view === "unassigned" || undefined,
          operatorId: operatorId ?? undefined,
          includeInactive: includeInactive || undefined,
          pageNumber: page,
          pageSize: PAGE_SIZE,
        }),
      [debouncedSearch, view, operatorId, includeInactive, page],
    ),
    "Failed to load clients",
  );

  // Managers: who can be assigned, with their workload.
  const operators = useAsync(
    useCallback(() => (seeAll ? fetchClientOperators() : Promise.resolve<OperatorOption[]>([])), [seeAll]),
    "Failed to load operators",
  );

  const workload = useMemo(
    () => [...(operators.data ?? [])].sort((a, b) => b.primaryCount - a.primaryCount),
    [operators.data],
  );

  const refresh = () => {
    void list.reload();
    if (seeAll) void operators.reload();
  };

  async function confirmDeactivate() {
    if (!deactivating) return;
    setBusy(true);
    try {
      await deactivateClient(deactivating.id);
      setNotice(`${deactivating.companyName} was deactivated.`);
      refresh();
    } catch (err) {
      list.setError(getErrorMessage(err, "Could not deactivate the client."));
    } finally {
      setBusy(false);
      setDeactivating(null);
    }
  }

  const rows = list.data?.items ?? [];
  const totalPages = list.data?.totalPages || 1;
  const pick = (v: View) => {
    setView(v);
    setOperatorId(null);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title="Clients"
        description={
          seeAll
            ? "Every client and who handles it. Assign each factory a primary operator and a backup."
            : "The clients you handle. Ask the Operations Manager to assign you another one."
        }
        actions={
          canCreate && (
            <button className="btn btn-primary" onClick={() => setEditing("new")}>
              <Plus size={16} /> Add client
            </button>
          )
        }
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      {/* Workload: managers see how clients are spread across operators. */}
      {seeAll && workload.length > 0 && (
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="section-label">Operator workload</span>
            {operatorId !== null && (
              <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400" onClick={() => setOperatorId(null)}>
                Show everyone
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {workload.map((o) => {
              const active = operatorId === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setView("all");
                    setOperatorId(active ? null : o.id);
                    setPage(1);
                  }}
                  aria-pressed={active}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                    active
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
                      : "border-line hover:border-indigo-300"
                  }`}
                >
                  <Avatar name={o.userName} src={o.imageUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{o.userName}</div>
                    <div className="text-[11px] text-fg-3">
                      {o.primaryCount} client{o.primaryCount === 1 ? "" : "s"} · {o.backupCount} backup
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          {seeAll ? (
            <div className="segmented" role="group" aria-label="Which clients">
              <button aria-pressed={view === "all"} onClick={() => pick("all")}>
                All clients
              </button>
              <button aria-pressed={view === "mine"} onClick={() => pick("mine")}>
                Mine
              </button>
              <button aria-pressed={view === "unassigned"} onClick={() => pick("unassigned")}>
                No operator
              </button>
            </div>
          ) : (
            <span className="section-label">My clients · {list.data?.totalCount ?? 0}</span>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {seeAll && (
              <label className="flex items-center gap-1.5 text-xs text-fg-2">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => {
                    setIncludeInactive(e.target.checked);
                    setPage(1);
                  }}
                />
                Show inactive
              </label>
            )}
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
              <input
                className="input w-64 pl-8"
                placeholder="Company, code, VAT, contact…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                aria-label="Search clients"
              />
            </div>
          </div>
        </div>

        {list.error && (
          <div className="p-4">
            <Alert>{list.error}</Alert>
          </div>
        )}

        {list.loading && !list.data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-fg-3">
            <Loader2 size={18} className="animate-spin text-indigo-600" /> Loading clients…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Building2 size={36} />} title={view === "unassigned" ? "Every client has an operator" : "No clients here"}>
            {view === "mine" && !seeAll
              ? "You don't handle any clients yet. Add one, or ask the Operations Manager to assign you."
              : debouncedSearch
                ? "Nothing matches your search."
                : "Add the first client with “Add client”."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>VAT TIN</th>
                  <th>Contact</th>
                  <th>CDC master list</th>
                  <th>Operators</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const primary = c.operators.find((o) => o.isPrimary);
                  const backups = c.operators.filter((o) => !o.isPrimary);
                  return (
                    <tr key={c.id} className={c.isActive ? undefined : "opacity-50"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.code && (
                            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                              {c.code}
                            </span>
                          )}
                          <span className="font-semibold text-fg">{c.companyName}</span>
                          {c.isMine && seeAll && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Mine</span>
                          )}
                          {!c.isActive && <span className="text-[10px] font-semibold text-fg-3">Inactive</span>}
                        </div>
                        <div className="text-[11px] text-fg-3">{c.businessType ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{c.vat}</td>
                      <td className="px-4 py-3">
                        <div>{c.contactName ?? "—"}</div>
                        <div className="text-[11px] text-fg-3">{[c.phone, c.email].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-fg-2">{c.cdcNo ?? ""}</div>
                        <CdcBadge date={c.cdcValidUntil} />
                      </td>
                      <td className="px-4 py-3">
                        {primary ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={primary.userName} src={primary.imageUrl} size="sm" />
                            <div>
                              <div className="flex items-center gap-1 font-medium text-fg">
                                <Crown size={11} className="text-amber-500" /> {primary.userName}
                              </div>
                              {backups.length > 0 && (
                                <div className="text-[11px] text-fg-3">
                                  Backup: {backups.map((b) => b.userName).join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            <UserX size={12} /> No operator
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canAssign && (
                            <button className="btn btn-sm btn-secondary" onClick={() => setAssigning(c)} title="Assign operators">
                              <UserCog size={14} /> Assign
                            </button>
                          )}
                          {canUpdate && (
                            <button className="btn-icon h-8 w-8" onClick={() => setEditing(c)} aria-label={`Edit ${c.companyName}`}>
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && c.isActive && (
                            <button
                              className="btn-icon h-8 w-8 text-rose-600"
                              onClick={() => setDeactivating(c)}
                              aria-label={`Deactivate ${c.companyName}`}
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-fg-3">
            <span>
              Page {page} of {totalPages} · {list.data?.totalCount} clients
            </span>
            <div className="flex gap-2">
              <button className="btn-icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <button className="btn-icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <ClientFormModal
          client={editing === "new" ? null : editing}
          assignsToMe={!seeAll}
          canDeactivate={canDelete}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            setNotice(editing === "new" ? `${saved.companyName} was added.` : `${saved.companyName} was saved.`);
            refresh();
            // A manager's new client still needs an operator.
            if (editing === "new" && canAssign && saved.operators.length === 0) setAssigning(saved);
          }}
        />
      )}
      {assigning && (
        <AssignOperatorsModal
          client={assigning}
          operators={operators.data ?? []}
          onClose={() => setAssigning(null)}
          onSaved={(saved) => {
            setAssigning(null);
            const primary = saved.operators.find((o) => o.isPrimary);
            setNotice(
              primary
                ? `${primary.userName} now handles ${saved.companyName}.`
                : `${saved.companyName} has no primary operator.`,
            );
            refresh();
          }}
        />
      )}
      {deactivating && (
        <ConfirmDialog
          title="Deactivate client?"
          message={`${deactivating.companyName} will be hidden from operators. Its history stays and you can reactivate it later.`}
          confirmLabel="Deactivate"
          busyLabel="Deactivating..."
          busy={busy}
          onConfirm={confirmDeactivate}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
}
