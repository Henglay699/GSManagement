/* eslint-disable react-hooks/set-state-in-effect */
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  FormEvent,
} from "react";
import {
  Check,
  Search,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  LeaveRequestDto,
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
  Pending:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-600/20 dark:ring-amber-800/50",
  Approved:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-800/50",
  Reject:
    "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-rose-600/20 dark:ring-rose-800/50",
  Cancel:
    "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 ring-slate-500/20 dark:ring-zinc-700/50",
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

interface UserSelectComboboxProps {
  users: EmployeeOption[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
}

function UserSelectCombobox({
  users,
  value,
  onChange,
  placeholder = "Select employee...",
}: UserSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find((u) => String(u.id) === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.userName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-[38px] w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
      >
        <span
          className={
            selectedUser
              ? "text-slate-800 dark:text-zinc-200"
              : "text-slate-400 dark:text-zinc-500"
          }
        >
          {selectedUser ? selectedUser.userName : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          <div className="sticky top-0 border-b border-slate-100 bg-white p-2 dark:border-zinc-700/50 dark:bg-zinc-800">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500"
              />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user..."
                className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-zinc-500"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="px-3 py-2.5 text-center text-xs text-slate-400 dark:text-zinc-500">
              No matching employee found
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = String(u.id) === value;
              return (
                <div
                  key={u.id}
                  onClick={() => {
                    onChange(String(u.id));
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-zinc-700/50 ${
                    isSelected
                      ? "bg-slate-50 font-medium text-slate-900 dark:bg-zinc-700/50 dark:text-zinc-100"
                      : "text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{u.userName}</span>
                  {isSelected && (
                    <Check
                      size={14}
                      className="text-slate-900 dark:text-zinc-100"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function LeaveHistoryPage() {
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 8;

  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(getFirstDayOfMonthString());
  const [toDate, setToDate] = useState(getLastDayOfMonthString());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const [editingRequest, setEditingRequest] = useState<LeaveRequestDto | null>(
    null,
  );
  const [deletingRequest, setDeletingRequest] =
    useState<LeaveRequestDto | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
      });

      if (statusFilter) params.set("status", statusFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (search) params.set("search", search);

      const data = await apiFetch<PagedResult<LeaveRequestDto>>(
        `/leave-requests?${params.toString()}`,
      );
      setRequests(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leave history.",
      );
    } finally {
      setLoading(false);
    }
  }, [pageNumber, statusFilter, search, fromDate, toDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleConfirmDelete(id: number) {
    setActioningId(id);
    try {
      await apiFetch(`/leave-requests/${id}`, { method: "DELETE" });
      setDeletingRequest(null);
      await loadHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete the leave request.",
      );
    } finally {
      setActioningId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
            Leave History
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            View historical leave records, statuses, and action logs.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500"
          />
          <input
            value={search}
            onChange={(e) => {
              setPageNumber(1);
              setSearch(e.target.value);
            }}
            placeholder="Search employee..."
            className="rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPageNumber(1);
            setStatusFilter(e.target.value as LeaveStatus | "");
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-zinc-500"
        >
          <option value="">All</option>
          <option value="Approved">Approved</option>
          <option value="Reject">Rejected</option>
          <option value="Cancel">Cancelled</option>
        </select>

        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-zinc-400">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPageNumber(1);
              setFromDate(e.target.value);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-zinc-500"
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
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-zinc-500"
            aria-label="To date"
          />
        </div>

        {(search || statusFilter || fromDate || toDate) && (
          <button
            onClick={() => {
              setPageNumber(1);
              setSearch("");
              setStatusFilter("");
              setFromDate(getFirstDayOfMonthString());
              setToDate(getLastDayOfMonthString());
            }}
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-zinc-800">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-zinc-800/50 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Days</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Approved By</th>
              <th className="px-4 py-3">Remark</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-400 dark:text-zinc-500"
                >
                  <Loader2 className="mx-auto animate-spin" size={18} />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-400 dark:text-zinc-500"
                >
                  No leave history found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-zinc-200">
                    <Link
                      to={`/leaves/detail/${r.id}`}
                      className="hover:underline text-slate-900 dark:text-zinc-100"
                    >
                      {r.userName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                    {r.leaveType}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                    {r.startDate} → {r.endDate}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                    {r.totalDays}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-zinc-400">
                    {r.approverName || "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500 dark:text-zinc-400">
                    {r.remark || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingRequest(r)}
                        title="Edit leave request"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        disabled={actioningId === r.id}
                        onClick={() => setDeletingRequest(r)}
                        title="Delete leave request"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-zinc-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-zinc-400">
        <span>
          Page {pageNumber} of {totalPages} · {totalCount} total
        </span>
        <div className="flex gap-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
            className="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Prev
          </button>
          <button
            disabled={pageNumber >= totalPages || totalPages === 0}
            onClick={() => setPageNumber((p) => p + 1)}
            className="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      </div>

      {editingRequest && (
        <EditLeaveRequestModal
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onUpdated={() => {
            setEditingRequest(null);
            loadHistory();
          }}
        />
      )}

      {deletingRequest && (
        <DeleteConfirmationModal
          request={deletingRequest}
          onClose={() => setDeletingRequest(null)}
          onConfirm={(id) => handleConfirmDelete(id)}
          submitting={actioningId === deletingRequest.id}
        />
      )}
    </div>
  );
}

interface DeleteConfirmationModalProps {
  request: LeaveRequestDto;
  onClose: () => void;
  onConfirm: (id: number) => void;
  submitting: boolean;
}

function DeleteConfirmationModal({
  request,
  onClose,
  onConfirm,
  submitting,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-transparent bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <Trash2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              Delete leave request
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">
          Are you sure you want to delete the leave request for{" "}
          <span className="font-semibold text-slate-900 dark:text-zinc-100">
            {request.userName}
          </span>{" "}
          ({request.startDate} → {request.endDate})?
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(request.id)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Deleting...
              </>
            ) : (
              "Delete request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditLeaveRequestModalProps {
  request: LeaveRequestDto;
  onClose: () => void;
  onUpdated: () => void;
}

function EditLeaveRequestModal({
  request,
  onClose,
  onUpdated,
}: EditLeaveRequestModalProps) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState({
    userId: String(request.userId),
    leaveType: request.leaveType,
    startDate: request.startDate,
    endDate: request.endDate,
    status: request.status,
    remark: request.remark || "",
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
      const payload = {
        userId: Number(form.userId),
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        remark: form.remark || undefined,
      };
      await apiFetch<LeaveRequestDto>(`/leave-requests/${request.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update the request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-transparent bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-zinc-100">
          Edit leave request
        </h2>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
              Employee
            </label>
            <UserSelectCombobox
              users={employees}
              value={form.userId}
              onChange={(userId) => setForm({ ...form, userId })}
              placeholder="Search and select employee..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Leave type
              </label>
              <select
                value={form.leaveType}
                onChange={(e) =>
                  setForm({ ...form, leaveType: e.target.value as LeaveType })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as LeaveStatus,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Reject">Rejected</option>
                <option value="Cancel">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Start date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                End date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
              Remark (optional)
            </label>
            <textarea
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
              placeholder="Reason or context for this leave..."
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
