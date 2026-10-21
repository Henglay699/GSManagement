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
  User,
} from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import {
  fetchLeaveRequestById,
  updateLeaveRequestStatus,
} from "../../services/leaveService";
import LeaveStatusBadge from "../../components/leave/LeaveStatusBadge";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";

export default function LeaveDetailPage() {
  const { hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const requestId = Number(id);

  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: request,
    loading,
    error: loadError,
  } = useAsync(
    useCallback(() => fetchLeaveRequestById(requestId), [requestId]),
    "Failed to load details.",
  );
  const error = actionError ?? loadError;

  async function handleApprove() {
    setActioning(true);
    try {
      await updateLeaveRequestStatus(requestId, { status: "Approved" });
      navigate(-1);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to approve request."));
    } finally {
      setActioning(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <ArrowLeft size={16} /> Back to Leave Requests
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 text-slate-400 dark:text-zinc-500">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm">Fetching leave request details...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : request ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Card Title Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                <FileText size={20} />
              </span>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
                  Leave Request #{request.id}
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Submitted on {request.createdAt}
                </p>
              </div>
            </div>
            <LeaveStatusBadge status={request.status} size="md" />
          </div>

          <div className="space-y-6 p-6">
            {/* Employee Profile Header */}
            <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/60">
              {request.userImageUrl ? (
                <img
                  src={request.userImageUrl}
                  alt={request.userName}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-200 dark:ring-zinc-700"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300">
                  <User size={28} />
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  {request.userName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
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
                {request.startDate} <span className="text-slate-400">→</span>{" "}
                {request.endDate}
              </InfoTile>
            </div>

            {/* Remark Section */}
            <div className="rounded-xl border border-slate-100 p-4 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                Remark / Justification
              </span>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-zinc-300">
                {request.remark || (
                  <span className="italic text-slate-400 dark:text-zinc-500">
                    No remark provided for this request.
                  </span>
                )}
              </p>
            </div>

            {request.approverName && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-zinc-800/40 dark:text-zinc-300">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>
                  Approved by: <strong>{request.approverName}</strong>
                </span>
              </div>
            )}
          </div>

          {request.status === "Pending" &&
            hasPermission(Permission.UpdateLeave) && (
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <button
                disabled={actioning}
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Check size={16} /> Approve Request
              </button>
            </div>
          )}
        </div>
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
    <div className="rounded-xl border border-slate-100 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-base font-medium text-slate-800 dark:text-zinc-200">
        {children}
      </p>
    </div>
  );
}
