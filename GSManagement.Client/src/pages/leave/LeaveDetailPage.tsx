import { ReactNode, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import {
  fetchLeaveRequestById,
  updateLeaveRequestStatus,
} from "../../services/leaveService";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import RejectLeaveModal from "../../components/leave/RejectLeaveModal";
import type { UpdateLeaveRequestStatusDto } from "../../types/leave";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";

export default function LeaveDetailPage() {
  const { hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requestId = Number(id);

  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // The last action taken here, per request (the page is reused across requests).
  const [done, setDone] = useState<{ id: number; status: UpdateLeaveRequestStatusDto["status"] } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const {
    data: request,
    loading,
    error: loadError,
    setData,
  } = useAsync(
    useCallback(() => fetchLeaveRequestById(requestId), [requestId]),
    "Failed to load details.",
  );
  const error = actionError ?? loadError;

  async function act(status: UpdateLeaveRequestStatusDto["status"], note?: string) {
    setActioning(true);
    setActionError(null);
    try {
      // Show the updated request right away; going "back" could land on a
      // stale copy of this page (e.g. when opened from the notification bell).
      setData(await updateLeaveRequestStatus(requestId, { status, note: note?.trim() || undefined }));
      setDone({ id: requestId, status });
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          status === "Cancel"
            ? "Failed to cancel the leave."
            : status === "Reject"
              ? "Failed to reject request."
              : "Failed to approve request.",
        ),
      );
    } finally {
      setActioning(false);
      setConfirmCancel(false);
      setRejecting(false);
    }
  }

  const canAct = hasPermission(Permission.UpdateLeave);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-line-strong dark:bg-subtle dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <ArrowLeft size={16} /> Back to Leave Requests
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-fg-3 dark:text-white0">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm">Fetching leave request details...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : request ? (
        <>
        {done?.id === request.id && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
            {done.status === "Cancel"
              ? `Leave cancelled. ${request.userName}'s days are back to normal attendance.`
              : done.status === "Reject"
                ? `Leave request rejected. ${request.userName} is expected at work on these days.`
                : `Leave request approved. ${request.userName}'s attendance has been updated.`}
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-line dark:bg-surface">
          {/* Card Title Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-line">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-subtle dark:text-zinc-300">
                <FileText size={20} />
              </span>
              <div>
                <h1 className="text-lg font-semibold text-fg">
                  Leave Request #{request.id}
                </h1>
                <p className="text-xs text-fg-2">
                  Submitted on {request.createdAt}
                </p>
              </div>
            </div>
            <LeaveStatusBadge status={request.status} size="md" />
          </div>

          <div className="space-y-6 p-6">
            {/* Employee Profile Header */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-subtle">
              {request.userImageUrl ? (
                <img
                  src={request.userImageUrl}
                  alt={request.userName}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-200 dark:ring-zinc-700"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300">
                  <UserIcon size={28} />
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-fg">
                  {request.userName}
                </h2>
                <p className="text-xs text-fg-2">
                  Employee ID: #{request.userId}
                </p>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InfoTile icon={<CalendarDays size={16} />} label="Leave Type">
                {request.leaveType}
              </InfoTile>
              <InfoTile icon={<Clock size={16} />} label="Duration">
                {request.totalDays}{" "}
                {request.totalDays === 1 ? "Working Day" : "Working Days"}
              </InfoTile>
              <InfoTile icon={<Calendar size={16} />} label="Date Range">
                {request.startDate} <span className="text-fg-3">→</span>{" "}
                {request.endDate}
              </InfoTile>
            </div>

            {/* Remark Section */}
            <div className="rounded-xl border border-slate-100 p-4 dark:border-line">
              <span className="text-xs font-medium text-fg-3 dark:text-white0">
                Remark / Justification
              </span>
              <p className="mt-2 whitespace-pre-line text-sm text-fg-2">
                {request.remark || (
                  <span className="italic text-fg-3 dark:text-white0">
                    No remark provided for this request.
                  </span>
                )}
              </p>
            </div>

            {request.approverName && (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-subtle dark:text-zinc-300">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>
                  {request.status === "Reject" ? "Rejected" : request.status === "Cancel" ? "Cancelled" : "Approved"} by:{" "}
                  <strong>{request.approverName}</strong>
                </span>
              </div>
            )}
          </div>

          {canAct && (request.status === "Pending" || request.status === "Approved") && (
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-line dark:bg-surface/50">
              {request.status === "Pending" ? (
                <>
                  <button
                    disabled={actioning}
                    onClick={() => setRejecting(true)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                  <button
                    disabled={actioning}
                    onClick={() => act("Approved")}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Check size={16} /> Approve Request
                  </button>
                </>
              ) : (
                <button
                  disabled={actioning}
                  onClick={() => setConfirmCancel(true)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <XCircle size={16} /> Cancel Leave
                </button>
              )}
            </div>
          )}
        </div>
        {rejecting && (
          <RejectLeaveModal
            request={request}
            onClose={() => setRejecting(false)}
            onConfirm={(note) => act("Reject", note)}
            submitting={actioning}
          />
        )}
        {confirmCancel && (
          <ConfirmDialog
            title="Cancel approved leave"
            message={`Cancel ${request.userName}'s ${request.leaveType} leave (${request.startDate} → ${request.endDate})? Past days without a clock-in will count as absent.`}
            confirmLabel="Cancel leave"
            busyLabel="Cancelling..."
            busy={actioning}
            onConfirm={() => act("Cancel")}
            onCancel={() => setConfirmCancel(false)}
          />
        )}
        </>
      ) : null}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4 dark:border-line">
      <div className="flex items-center gap-2 text-xs text-fg-3 dark:text-white0">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-base font-medium text-fg">
        {children}
      </p>
    </div>
  );
}
