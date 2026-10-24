import { useCallback, useState } from "react";
import {
  AlertCircle,
  CalendarOff,
  Loader2,
  Plus,
} from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import {
  cancelMyLeaveRequest,
  fetchMyLeaveRequests,
} from "../../services/myLeaveService";
import LeaveFormModal from "../../components/leave/LeaveFormModal";
import LeaveStatusBadge, {
  HalfDayBadge,
} from "../../components/leave/LeaveStatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import type { LeaveRequestDto, LeaveStatus } from "../../types/leave";

const PAGE_SIZE = 10;

// The logged-in employee's own leave: request, track, and withdraw.
export default function MyLeavePage() {
  const [status, setStatus] = useState<LeaveStatus | "">("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [toCancel, setToCancel] = useState<LeaveRequestDto | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(
    useCallback(
      () =>
        fetchMyLeaveRequests({
          status: status || undefined,
          pageNumber: page,
          pageSize: PAGE_SIZE,
        }),
      [status, page],
    ),
    "Failed to load your leave requests.",
  );

  async function handleCancel() {
    if (!toCancel) return;
    setCancelling(true);
    setActionError(null);
    try {
      await cancelMyLeaveRequest(toCancel.id);
      setToCancel(null);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to cancel the request."));
      setToCancel(null);
    } finally {
      setCancelling(false);
    }
  }

  const shownError = actionError ?? error;
  const items = data?.items ?? [];

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2">
            <CalendarOff size={20} className="text-indigo-600 dark:text-indigo-400" />
            My Leave
          </h1>
          <p className="text-sm text-fg-2">
            Request full or half-day leave. HR will review it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LeaveStatus | "");
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Reject">Rejected</option>
            <option value="Cancel">Cancelled</option>
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus size={14} />
            Request Leave
          </button>
        </div>
      </div>

      {shownError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          <AlertCircle size={16} className="shrink-0" />
          <span>{shownError}</span>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="border-b border-slate-200 dark:border-line text-fg-2 font-semibold">
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4">Days</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Reviewed by</th>
              <th className="py-3 px-4">Remark</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-line">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center">
                  <Loader2 className="w-5 h-5 animate-spin inline text-indigo-500" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-fg-3 dark:text-white0">
                  No leave requests yet.
                </td>
              </tr>
            ) : (
              items.map((lr) => (
                <tr key={lr.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800">
                  <td className="py-3 px-4 font-semibold text-fg">
                    <div className="flex items-center gap-1.5">
                      {lr.leaveType}
                      {lr.isHalfDay && <HalfDayBadge period={lr.halfDayPeriod} />}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-fg-2">
                    {lr.startDate === lr.endDate
                      ? lr.startDate
                      : `${lr.startDate} → ${lr.endDate}`}
                  </td>
                  <td className="py-3 px-4">{lr.isHalfDay ? "0.5" : lr.totalDays}</td>
                  <td className="py-3 px-4">
                    <LeaveStatusBadge status={lr.status} />
                  </td>
                  <td className="py-3 px-4 text-fg-2">
                    {lr.approverName && lr.status !== "Pending" ? lr.approverName : "--"}
                  </td>
                  <td className="py-3 px-4 text-fg-3 max-w-xs truncate whitespace-pre-line">
                    {lr.remark || "--"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {lr.status === "Pending" && (
                      <button
                        onClick={() => setToCancel(lr)}
                        className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-2xl px-3 py-1.5 border border-slate-200 dark:border-line-strong disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-fg-2">
            Page {data.pageNumber} of {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-2xl px-3 py-1.5 border border-slate-200 dark:border-line-strong disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <LeaveFormModal
          self
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setPage(1);
            reload();
          }}
        />
      )}

      {toCancel && (
        <ConfirmDialog
          title="Cancel leave request"
          message={`Withdraw your ${toCancel.leaveType} leave request starting ${toCancel.startDate}?`}
          confirmLabel="Cancel request"
          busyLabel="Cancelling..."
          busy={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setToCancel(null)}
        />
      )}
    </div>
  );
}
