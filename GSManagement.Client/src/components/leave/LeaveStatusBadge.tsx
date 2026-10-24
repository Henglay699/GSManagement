import type { LeaveStatus } from "../../types/leave";

const STATUS_STYLES: Record<LeaveStatus, string> = {
  Pending:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-600/20 dark:ring-amber-800/50",
  Approved:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-800/50",
  Reject:
    "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-rose-600/20 dark:ring-rose-800/50",
  Cancel:
    "bg-slate-100 dark:bg-subtle text-fg-2 ring-slate-500/20 dark:ring-zinc-700",
};

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  size?: "sm" | "md";
}

export default function LeaveStatusBadge({
  status,
  size = "sm",
}: LeaveStatusBadgeProps) {
  const sizing =
    size === "md" ? "px-3 py-1 font-semibold" : "px-2.5 py-0.5 font-medium";
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs ring-1 ring-inset ${sizing} ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function HalfDayBadge({
  period,
}: {
  period?: "Morning" | "Afternoon" | null;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20">
      ½ Day{period ? ` (${period})` : ""}
    </span>
  );
}
