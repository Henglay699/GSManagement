import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  X,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { paths } from "../lib/paths";
import { Permission } from "../lib/permissions";
import { fetchPendingLeaveCount } from "../services/leaveService";
import type { LeaveRequestDto } from "../types/leave";

// Names must match LeaveNotifier on the backend.
const PENDING_COUNT_EVENT = "PendingLeaveCount";
const LEAVE_REQUESTED_EVENT = "LeaveRequested";

const TOAST_MS = 8000;

interface LeaveNotificationsContextType {
  // Pending requests awaiting review; null for users who can't review leave.
  pendingCount: number | null;
}

const LeaveNotificationsContext = createContext<LeaveNotificationsContextType>({
  pendingCount: null,
});

// For HR/Admin (ViewLeave): keeps the pending-leave count live and pops a
// toast whenever an employee submits a request. Does nothing for others.
export function LeaveNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hub, hasPermission } = useAuth();
  const canReview = hasPermission(Permission.ViewLeave);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [toasts, setToasts] = useState<LeaveRequestDto[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial count, and again after a reconnect in case pushes were missed.
  const loadCount = useCallback(() => {
    fetchPendingLeaveCount().then(setPendingCount, () => {});
  }, []);

  useEffect(() => {
    if (canReview) loadCount();
  }, [canReview, loadCount]);

  useEffect(() => {
    if (!hub || !canReview) return;

    const onCount = (count: number) => setPendingCount(count);
    const onRequested = (request: LeaveRequestDto) => {
      setToasts((prev) => [request, ...prev].slice(0, 3));
      setTimeout(() => dismiss(request.id), TOAST_MS);
    };

    hub.on(PENDING_COUNT_EVENT, onCount);
    hub.on(LEAVE_REQUESTED_EVENT, onRequested);
    hub.onreconnected(loadCount);
    return () => {
      hub.off(PENDING_COUNT_EVENT, onCount);
      hub.off(LEAVE_REQUESTED_EVENT, onRequested);
    };
  }, [hub, canReview, loadCount, dismiss]);

  return (
    <LeaveNotificationsContext.Provider
      value={{ pendingCount: canReview ? pendingCount : null }}
    >
      {children}

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className="flex items-start gap-3 rounded-2xl bg-surface border border-slate-200 dark:border-line shadow-xl p-4"
            >
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 shrink-0">
                <Bell size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-fg">
                  New leave request
                </div>
                <div className="text-xs text-fg-2 mt-0.5">
                  {t.userName} · {t.leaveType}
                  {t.isHalfDay ? ` (½ day ${t.halfDayPeriod ?? ""})` : ""}
                </div>
                <div className="text-[11px] text-fg-3">
                  {t.startDate}
                  {t.endDate !== t.startDate && ` → ${t.endDate}`}
                </div>
                <Link
                  to={paths.leaveDetail(t.id)}
                  onClick={() => dismiss(t.id)}
                  className="inline-block mt-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Review
                </Link>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-fg-3 hover:text-slate-600 dark:hover:text-zinc-200"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </LeaveNotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLeaveNotifications = () => useContext(LeaveNotificationsContext);
