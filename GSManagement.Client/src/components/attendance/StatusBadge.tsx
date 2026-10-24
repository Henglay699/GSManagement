import type { ReactNode } from "react";
import { Ban, CheckCircle2, Clock, Coffee, Hourglass, Timer, XCircle } from "lucide-react";
import { DAY_STATUS, fmtMinutes, fmtTime } from "../../lib/attendanceDisplay";
import type { DayStatus, SummaryDay } from "../../types/attendance";

const BADGE = "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold";
const TONE = {
  emerald:
    "border-emerald-200/80 bg-emerald-50/90 text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber: "border-amber-200/80 bg-amber-50/90 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  purple:
    "border-purple-200/80 bg-purple-50/90 text-purple-800 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300",
  indigo:
    "border-indigo-200/80 bg-indigo-50/90 text-indigo-800 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-300",
  sky: "border-sky-200/80 bg-sky-50/90 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-300",
  rose: "border-rose-200/80 bg-rose-50/90 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300",
  muted:
    "border-slate-200/60 bg-slate-100/70 font-medium text-slate-400 dark:border-zinc-700/60 dark:bg-zinc-800/70 dark:text-zinc-500",
};

const ICON: Partial<Record<DayStatus, [keyof typeof TONE, ReactNode]>> = {
  Present: ["emerald", <CheckCircle2 size={12} className="shrink-0" />],
  Late: ["amber", <Clock size={12} className="shrink-0 text-amber-600 dark:text-amber-400" />],
  HalfDay: ["indigo", <Hourglass size={12} className="shrink-0 text-indigo-600 dark:text-indigo-400" />],
  OnLeave: ["purple", <Coffee size={12} className="shrink-0 text-purple-600 dark:text-purple-400" />],
  Absent: ["rose", <XCircle size={12} className="shrink-0 text-rose-600 dark:text-rose-400" />],
  InProgress: ["sky", <Timer size={12} className="shrink-0 text-sky-600 dark:text-sky-400" />],
  NotClockedIn: ["muted", <Clock size={11} className="shrink-0" />],
  NoRecord: ["muted", <Ban size={11} className="shrink-0" />],
};

/** Icon + text pill for a day status. `text` replaces the status name (e.g. hours worked). */
export function StatusBadge({ status, text }: { status: DayStatus; text?: string | null }) {
  const s = DAY_STATUS[status];
  const label = text || s.label;

  if (status === "Upcoming") return null;
  if (status === "Holiday")
    return (
      <span
        className="block max-w-[110px] truncate rounded-md border border-amber-200 bg-amber-100/80 px-1.5 py-0.5 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
        title={s.meaning}
      >
        {label}
      </span>
    );
  if (status === "DayOff")
    return (
      <span
        className="inline-flex items-center rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
        title={s.meaning}
      >
        {label}
      </span>
    );

  const [tone, icon] = ICON[status] ?? ICON.NoRecord!;
  return (
    <span className={`${BADGE} ${TONE[tone]}`} title={s.meaning}>
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Worked days show their hours, today shows the clock-in, holidays their name. */
function dayBadgeText(day: SummaryDay): string | null {
  switch (day.status) {
    case "Present":
    case "Late":
    case "HalfDay":
      return day.workedMinutes ? fmtMinutes(day.workedMinutes) : null;
    case "InProgress":
      return `In ${fmtTime(day.checkInTime)}`;
    case "Holiday":
      return day.holidayName;
    default:
      return null;
  }
}

/** The badge as the grid and calendar show it: hours, plus overtime and missed clock-out tags. */
export function DayBadges({ day }: { day: SummaryDay }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <StatusBadge status={day.status} text={dayBadgeText(day)} />
      {day.overtimeMinutes > 0 && (
        <span className="inline-flex items-center rounded border border-amber-200 bg-amber-100/80 px-1.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          +{(day.overtimeMinutes / 60).toFixed(1)}h OT
        </span>
      )}
      {day.missedClockOut && (
        <span className="inline-flex items-center rounded border border-rose-200 bg-rose-100/80 px-1.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          No out
        </span>
      )}
    </div>
  );
}
