/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { Check, X, Plus, Search, Loader2, AlertCircle } from "lucide-react";
import type {
  LeaveRequestDto,
  CreateLeaveRequestDto,
  LeaveStatus,
  LeaveType,
  PagedResult,
  EmployeeOption,
  ApiErrorBody,
} from "../../types/leave";
import {
  getFirstDayOfMonthString,
  getLastDayOfMonthString,
} from "../../utils/datetimeformater";

// ---------------------------------------------------------------------------
// API Configuration
// ---------------------------------------------------------------------------

const API_BASE = "/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  return res.status === 204 ? (null as T) : ((await res.json()) as T);
}

function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.$values)) return obj.$values as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
}

const STATUS_STYLES: Record<LeaveStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Reject: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Cancel: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const LEAVE_TYPES: LeaveType[] = ["Sick", "Maternity", "Emergency", "Personal"];

function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function LeaveRequestsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0); // Track pending requests count for badges
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // History tab defaults to showing Approved leave
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(getFirstDayOfMonthString());
  const [toDate, setToDate] = useState(getLastDayOfMonthString());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch the count of pending requests independently so badges are always accurate
  const fetchPendingCount = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "Pending", pageSize: "1" });
      const data = await apiFetch<PagedResult<LeaveRequestDto>>(
        `/leave-requests?${params.toString()}`,
      );
      setPendingCount(data.totalCount);
    } catch {
      // Fail silently for badge count to avoid disrupting the UI
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
      });

      if (activeTab === "pending") {
        params.set("status", "Pending");
      } else {
        if (statusFilter) params.set("status", statusFilter);
        if (fromDate) params.set("fromDate", fromDate);
        if (toDate) params.set("toDate", toDate);
      }

      if (search) params.set("search", search);

      const data = await apiFetch<PagedResult<LeaveRequestDto>>(
        `/leave-requests?${params.toString()}`,
      );
      setRequests(data.items);
      setTotalCount(data.totalCount);

      // If we are on the pending tab, totalCount and pendingCount are the same
      if (activeTab === "pending") {
        setPendingCount(data.totalCount);
      } else {
        fetchPendingCount(); // Keep badge updated in the background
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leave requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    pageNumber,
    statusFilter,
    search,
    fromDate,
    toDate,
    activeTab,
    fetchPendingCount,
  ]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleAction(
    id: number,
    status: Extract<LeaveStatus, "Approved" | "Reject">,
  ) {
    setActioningId(id);
    try {
      await apiFetch<LeaveRequestDto>(`/leave-requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadRequests();
      await fetchPendingCount(); // Refresh badge count immediately
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update the request.",
      );
    } finally {
      setActioningId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">
                Leave requests
              </h1>
              {pendingCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Review employee leave and create requests on their behalf.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus size={16} /> New leave request
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("pending");
            setPageNumber(1);
          }}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>Requires Action</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setPageNumber(1);
          }}
          className={`pb-3 text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 border-slate-900 text-slate-900"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Leave History
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => {
              setPageNumber(1);
              setSearch(e.target.value);
            }}
            placeholder="Search employee..."
            className="rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {activeTab === "history" && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => {
                setPageNumber(1);
                setStatusFilter(e.target.value as LeaveStatus | "");
              }}
              className="rounded-lg border border-slate-200 py-2 px-3 text-sm outline-none focus:border-slate-400"
            >
              <option value="">All History</option>
              <option value="Approved">Approved</option>
              <option value="Reject">Rejected</option>
              <option value="Cancel">Cancelled</option>
            </select>

            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setPageNumber(1);
                  setFromDate(e.target.value);
                }}
                className="rounded-lg border border-slate-200 py-2 px-3 text-sm outline-none focus:border-slate-400"
                aria-label="From date"
              />
              <span>to</span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => {
                  setPageNumber(1);
                  setToDate(e.target.value);
                }}
                className="rounded-lg border border-slate-200 py-2 px-3 text-sm outline-none focus:border-slate-400"
                aria-label="To date"
              />
            </div>
          </>
        )}

        {(search ||
          (activeTab === "history" &&
            (statusFilter || fromDate || toDate))) && (
          <button
            onClick={() => {
              setPageNumber(1);
              setSearch("");
              if (activeTab === "history") {
                setStatusFilter("");
                setFromDate(getFirstDayOfMonthString());
                setToDate(getLastDayOfMonthString());
              }
            }}
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Remark</th>
              {activeTab === "pending" && (
                <th className="px-4 py-3 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={activeTab === "pending" ? 7 : 6}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  <Loader2 className="mx-auto animate-spin" size={18} />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td
                  colSpan={activeTab === "pending" ? 7 : 6}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No leave requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.userName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.leaveType}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.startDate} → {r.endDate}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.totalDays}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                    {r.remark || "—"}
                  </td>
                  {activeTab === "pending" && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          disabled={actioningId === r.id}
                          onClick={() => handleAction(r.id, "Approved")}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          disabled={actioningId === r.id}
                          onClick={() => handleAction(r.id, "Reject")}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Page {pageNumber} of {totalPages} · {totalCount} total
        </span>
        <div className="flex gap-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
            className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
          >
            Prev
          </button>
          <button
            disabled={pageNumber >= totalPages || totalPages === 0}
            onClick={() => setPageNumber((p) => p + 1)}
            className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>

      {showCreateModal && (
        <CreateLeaveRequestModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            setPageNumber(1);
            setActiveTab("pending");
            loadRequests();
            fetchPendingCount();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal Component
// ---------------------------------------------------------------------------

interface CreateFormState {
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remark: string;
  initialStatus: Extract<LeaveStatus, "Pending" | "Approved">;
}

interface CreateLeaveRequestModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateLeaveRequestModal({
  onClose,
  onCreated,
}: CreateLeaveRequestModalProps) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState<CreateFormState>({
    userId: "",
    leaveType: "Sick",
    startDate: "",
    endDate: "",
    remark: "",
    initialStatus: "Pending",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<unknown>("/user/select-options")
      .then((data) => setEmployees(toArray<EmployeeOption>(data)))
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load employees.",
        ),
      );
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.userId || !form.startDate || !form.endDate) {
      setError("Please fill in employee, start date, and end date.");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateLeaveRequestDto = {
        userId: Number(form.userId),
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        remark: form.remark || undefined,
        initialStatus: form.initialStatus,
      };
      await apiFetch<LeaveRequestDto>("/leave-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create the request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Create leave request
        </h2>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Employee
            </label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="">Select employee...</option>
              {employees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.userName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Leave type
              </label>
              <select
                value={form.leaveType}
                onChange={(e) =>
                  setForm({ ...form, leaveType: e.target.value as LeaveType })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Set status to
              </label>
              <select
                value={form.initialStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initialStatus: e.target
                      .value as CreateFormState["initialStatus"],
                  })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved (skip review)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Start date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                End date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Remark (optional)
            </label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="Reason or context for this leave..."
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
