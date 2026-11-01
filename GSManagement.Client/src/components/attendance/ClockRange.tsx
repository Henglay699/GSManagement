import { fmtMinutes, fmtTime12 } from "../../lib/attendanceDisplay";
import type { SummaryDay } from "../../types/attendance";

const WARN = "font-semibold text-orange-600 dark:text-orange-400";

// "08:56 AM ●── 8h 12m ──● 05:00 PM": a late clock-in or early clock-out is orange.
export default function ClockRange({ day }: { day: SummaryDay }) {
  if (!day.checkInTime) return <span className="text-fg-3">–</span>;

  const late = day.lateMinutes > 0;
  const early = day.earlyLeaveMinutes > 0;
  const working = !day.checkOutTime && !day.missedClockOut;
  const line = working ? "border-t border-dashed border-sky-400" : "border-t border-slate-300 dark:border-zinc-600";

  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap text-[13px] tabular-nums">
      <span
        className={late ? WARN : "font-medium text-fg"}
        title={late ? `Late by ${fmtMinutes(day.lateMinutes)}` : undefined}
      >
        {fmtTime12(day.checkInTime)}
      </span>

      <span className="flex min-w-[96px] flex-1 items-center gap-1 text-[10px] text-fg-3">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-zinc-500" />
        <span className={`flex-1 ${line}`} />
        <span>{day.workedMinutes ? fmtMinutes(day.workedMinutes) : working ? "working" : "–"}</span>
        <span className={`flex-1 ${line}`} />
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            day.missedClockOut ? "bg-rose-500" : working ? "bg-sky-400" : "bg-slate-400 dark:bg-zinc-500"
          }`}
        />
      </span>

      {day.missedClockOut ? (
        <span className="font-semibold text-rose-600 dark:text-rose-400">No clock-out</span>
      ) : working ? (
        <span className="font-medium text-sky-600 dark:text-sky-400">Working</span>
      ) : (
        <span
          className={early ? WARN : "font-medium text-fg"}
          title={early ? `Left ${fmtMinutes(day.earlyLeaveMinutes)} early` : undefined}
        >
          {fmtTime12(day.checkOutTime)}
        </span>
      )}
    </div>
  );
}
