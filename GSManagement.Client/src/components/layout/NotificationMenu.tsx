import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, CheckCheck, Loader2 } from "lucide-react";
import { useLeaveNotifications } from "../../context/LeaveNotificationsContext";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { fetchLeaveRequests } from "../../services/leaveService";
import type { LeaveRequestDto } from "../../types/leave";
import Avatar from "../ui/Avatar";

const MAX_ITEMS = 8;

const fmtDay = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days}d ago` : fmtDay(iso);
}

// HR's bell: opens a dropdown of leave requests waiting for review.
// The count is pushed live (LeaveNotificationsContext); the list loads on open
// and reloads whenever the count changes while it's open.
export default function NotificationMenu({ buttonClass }: { buttonClass: string }) {
  const navigate = useNavigate();
  const { pendingCount } = useLeaveNotifications();
  const pending = pendingCount ?? 0;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LeaveRequestDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const page = await fetchLeaveRequests({ status: "Pending", pageNumber: 1, pageSize: MAX_ITEMS });
      setItems([...page.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load notifications."));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on open / when the live count moves
    if (open) load();
  }, [open, pendingCount, load]);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={buttonClass}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={pending ? `${pending} leave requests to review` : "Notifications"}
        title="Notifications"
      >
        <Bell size={18} />
        {pending > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white dark:border-zinc-900">
            {pending > 99 ? "99+" : pending}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Notifications</span>
            {pending > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                {pending} pending
              </span>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {error ? (
              <p className="px-4 py-6 text-center text-xs text-rose-600 dark:text-rose-400">{error}</p>
            ) : items === null ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
                <CheckCheck size={22} className="text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">You're all caught up</p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">No leave requests waiting for review.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
                {items.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => go(paths.leaveDetail(r.id))}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                    >
                      <Avatar name={r.userName} src={r.userImageUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-snug text-slate-600 dark:text-zinc-300">
                          <span className="font-semibold text-slate-800 dark:text-zinc-100">{r.userName}</span> requested{" "}
                          <span className="font-semibold text-slate-800 dark:text-zinc-100">
                            {r.isHalfDay ? `half-day ${r.leaveType.toLowerCase()}` : r.leaveType.toLowerCase()}
                          </span>{" "}
                          leave
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400 dark:text-zinc-500">
                          {fmtDay(r.startDate)}
                          {r.endDate.slice(0, 10) !== r.startDate.slice(0, 10) && ` – ${fmtDay(r.endDate)}`}
                          {r.isHalfDay
                            ? ` · ${r.halfDayPeriod?.toLowerCase() ?? ""}`
                            : ` · ${r.totalDays} day${r.totalDays === 1 ? "" : "s"}`}
                          {" · "}
                          {timeAgo(r.createdAt)}
                        </span>
                      </span>
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => go(paths.leaveRequests)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:text-indigo-400 dark:hover:bg-zinc-800"
          >
            View all leave requests <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
