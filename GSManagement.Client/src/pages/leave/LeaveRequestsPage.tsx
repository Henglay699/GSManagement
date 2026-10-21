import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import {
  deleteLeaveRequest,
  fetchLeaveRequests,
  updateLeaveRequestStatus,
} from "../../services/leaveService";
import type { LeaveRequestDto } from "../../types/leave";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LeaveFormModal from "../../components/leave/LeaveFormModal";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import RejectLeaveModal from "../../components/leave/RejectLeaveModal";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";

const PAGE_SIZE = 8;

export default function LeaveRequestsPage() {
  const { hasPermission } = useAuth();
  const [pageNumber, setPageNumber] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] =
    useState<LeaveRequestDto | null>(null);
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
          status: "Pending",
          search: debouncedSearch,
        }),
      [pageNumber, debouncedSearch],
    ),
    "Failed to load leave requests.",
  );

  const requests = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const error = actionError ?? loadError;

  // Runs an approve/reject/delete action, then refreshes the list.
  async function runAction(
    id: number,
    action: () => Promise<unknown>,
    fallbackError: string,
  ) {
    setActioningId(id);
    setActionError(null);
    try {
      await action();
      await reload();
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err, fallbackError));
      return false;
    } finally {
      setActioningId(null);
    }
  }

  const handleApprove = (id: number) =>
    runAction(
      id,
      () => updateLeaveRequestStatus(id, { status: "Approved" }),
      "Failed to update the request.",
    );

  const handleConfirmReject = async (id: number, note: string) => {
    const ok = await runAction(
      id,
      () => updateLeaveRequestStatus(id, { status: "Reject", note }),
      "Failed to reject the request.",
    );
    if (ok) setRejectingRequest(null);
  };

  const handleConfirmDelete = async (id: number) => {
    const ok = await runAction(
      id,
      () => deleteLeaveRequest(id),
      "Failed to delete the leave request.",
    );
    if (ok) setDeletingRequest(null);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
              Pending Leave Requests
            </h1>
            {totalCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                {totalCount} pending
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Review pending leave requests requiring action.
          </p>
        </div>

        {hasPermission(Permission.CreateLeave) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            <Plus size={16} /> New leave request
          </button>
        )}
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

        {search && (
          <button
            onClick={() => {
              setPageNumber(1);
              setSearch("");
            }}
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear search
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
              <th className="px-4 py-3">Remark</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-400 dark:text-zinc-500"
                >
                  <Loader2 className="mx-auto animate-spin" size={18} />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-400 dark:text-zinc-500"
                >
                  No pending leave requests found.
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
                      to={paths.leaveDetail(r.id)}
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
                    <LeaveStatusBadge status={r.status} />
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500 dark:text-zinc-400">
                    {r.remark || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      {hasPermission(Permission.UpdateLeave) && (
                        <>
                          <button
                            disabled={actioningId === r.id}
                            onClick={() => handleApprove(r.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            disabled={actioningId === r.id}
                            onClick={() => setRejectingRequest(r)}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}
                      {hasPermission(Permission.DeleteLeave) && (
                        <button
                          disabled={actioningId === r.id}
                          onClick={() => setDeletingRequest(r)}
                          title="Delete leave request"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-zinc-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 size={13} />
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
            disabled={pageNumber >= totalPages}
            onClick={() => setPageNumber((p) => p + 1)}
            className="rounded-md border border-slate-200 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      </div>

      {showCreateModal && (
        <LeaveFormModal
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            if (pageNumber === 1) reload();
            else setPageNumber(1);
          }}
        />
      )}

      {rejectingRequest && (
        <RejectLeaveModal
          request={rejectingRequest}
          onClose={() => setRejectingRequest(null)}
          onConfirm={(note) => handleConfirmReject(rejectingRequest.id, note)}
          submitting={actioningId === rejectingRequest.id}
        />
      )}

      {deletingRequest && (
        <ConfirmDialog
          title="Delete leave request"
          message={
            <>
              Are you sure you want to delete the leave request for{" "}
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {deletingRequest.userName}
              </span>{" "}
              ({deletingRequest.startDate} → {deletingRequest.endDate})? This
              action cannot be undone.
            </>
          }
          confirmLabel="Delete request"
          busy={actioningId === deletingRequest.id}
          onConfirm={() => handleConfirmDelete(deletingRequest.id)}
          onCancel={() => setDeletingRequest(null)}
        />
      )}
    </div>
  );
}
