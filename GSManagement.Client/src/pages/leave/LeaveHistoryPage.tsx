import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import {
  deleteLeaveRequest,
  fetchLeaveRequests,
} from "../../services/leaveService";
import type { LeaveRequestDto, LeaveStatus } from "../../types/leave";
import {
  getFirstDayOfMonthString,
  getLastDayOfMonthString,
} from "../../utils/dateTimeFormatter";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LeaveFormModal from "../../components/leave/LeaveFormModal";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";

const PAGE_SIZE = 8;

const filterInputClass =
  "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 dark:border-line-strong dark:bg-surface dark:text-zinc-200 dark:focus:border-white0";

export default function LeaveHistoryPage() {
  const { hasPermission } = useAuth();
  const [pageNumber, setPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "">("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [fromDate, setFromDate] = useState(getFirstDayOfMonthString());
  const [toDate, setToDate] = useState(getLastDayOfMonthString());

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<LeaveRequestDto | null>(
    null,
  );
  const [deletingRequest, setDeletingRequest] =
    useState<LeaveRequestDto | null>(null);

  const {
    data,
    loading,
    error: loadError,
    reload,
  } = useAsync(
    useCallback(
      () =>
        fetchLeaveRequests({
          pageNumber,
          pageSize: PAGE_SIZE,
          status: statusFilter || undefined,
          fromDate,
          toDate,
          search: debouncedSearch,
        }),
      [pageNumber, statusFilter, debouncedSearch, fromDate, toDate],
    ),
    "Failed to load leave history.",
  );

  const requests = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const error = deleteError ?? loadError;

  // Wraps a filter setter so changing any filter jumps back to page 1.
  const onFilter =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setPageNumber(1);
      setter(value);
    };

  async function handleConfirmDelete(id: number) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteLeaveRequest(id);
      setDeletingRequest(null);
      await reload();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete the leave request."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-fg">
          Leave History
        </h1>
        <p className="text-sm text-fg-2">
          View historical leave records, statuses, and action logs.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-2.5 top-2.5 text-fg-3 dark:text-white0"
          />
          <input
            value={search}
            onChange={(e) => onFilter(setSearch)(e.target.value)}
            placeholder="Search employee..."
            className="rounded-2xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-800 outline-none placeholder:text-fg-3 focus:border-slate-400 dark:border-line-strong dark:bg-surface dark:text-zinc-200 dark:placeholder:text-white0 dark:focus:border-white0"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            onFilter(setStatusFilter)(e.target.value as LeaveStatus | "")
          }
          className={filterInputClass}
        >
          <option value="">All</option>
          <option value="Approved">Approved</option>
          <option value="Reject">Rejected</option>
          <option value="Cancel">Cancelled</option>
        </select>

        <div className="flex items-center gap-1.5 text-sm text-fg-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFilter(setFromDate)(e.target.value)}
            className={filterInputClass}
            aria-label="From date"
          />
          <span>to</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => onFilter(setToDate)(e.target.value)}
            className={filterInputClass}
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
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-line">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-line">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-subtle dark:text-zinc-400">
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
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-line dark:bg-surface">
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-fg-3 dark:text-white0"
                >
                  <Loader2 className="mx-auto animate-spin" size={18} />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-fg-3 dark:text-white0"
                >
                  No leave history found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-zinc-800"
                >
                  <td className="px-4 py-3 font-medium text-fg">
                    <Link
                      to={paths.leaveDetail(r.id)}
                      className="hover:underline text-fg"
                    >
                      {r.userName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg-2">
                    {r.leaveType}
                  </td>
                  <td className="px-4 py-3 text-fg-2">
                    {r.startDate} → {r.endDate}
                  </td>
                  <td className="px-4 py-3 text-fg-2">
                    {r.totalDays}
                  </td>
                  <td className="px-4 py-3">
                    <LeaveStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-fg-2">
                    {r.approverName || "—"}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-fg-2">
                    {r.remark || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {hasPermission(Permission.UpdateLeave) && (
                        <button
                          onClick={() => setEditingRequest(r)}
                          title="Edit leave request"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-line-strong dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                      {hasPermission(Permission.DeleteLeave) && (
                        <button
                          disabled={deletingId === r.id}
                          onClick={() => setDeletingRequest(r)}
                          title="Delete leave request"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-line-strong dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-fg-2">
        <span>
          Page {pageNumber} of {totalPages} · {totalCount} total
        </span>
        <div className="flex gap-2">
          <button
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-line-strong dark:hover:bg-zinc-800"
          >
            Prev
          </button>
          <button
            disabled={pageNumber >= totalPages}
            onClick={() => setPageNumber((p) => p + 1)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-line-strong dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      </div>

      {editingRequest && (
        <LeaveFormModal
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSaved={() => {
            setEditingRequest(null);
            reload();
          }}
        />
      )}

      {deletingRequest && (
        <ConfirmDialog
          title="Delete leave request"
          message={
            <>
              Are you sure you want to delete the leave request for{" "}
              <span className="font-semibold text-fg">
                {deletingRequest.userName}
              </span>{" "}
              ({deletingRequest.startDate} → {deletingRequest.endDate})? This
              action cannot be undone.
            </>
          }
          confirmLabel="Delete request"
          busy={deletingId === deletingRequest.id}
          onConfirm={() => handleConfirmDelete(deletingRequest.id)}
          onCancel={() => setDeletingRequest(null)}
        />
      )}
    </div>
  );
}
