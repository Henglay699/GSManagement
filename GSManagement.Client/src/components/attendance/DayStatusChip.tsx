import type { DayStatus, SummaryDay } from "../../types/attendance";
import { DAY_STATUS, FLAG_TONE, dayFlags } from "../../lib/attendanceDisplay";

// The day's one status, as a coloured pill.
export function DayStatusChip({ status }: { status: DayStatus }) {
  const s = DAY_STATUS[status];
  return (
    <span className={s.chip} title={s.meaning}>
      <span className="dot" />
      {s.label}
    </span>
  );
}

// Problems inside a worked day (late, left early, missed clock-out, overtime).
export function DayFlags({
  day,
}: {
  day: Pick<SummaryDay, "lateMinutes" | "earlyLeaveMinutes" | "missedClockOut" | "overtimeMinutes">;
}) {
  const flags = dayFlags(day);
  if (!flags.length) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-bold">
      {flags.map((f) => (
        <span key={f.key} className={FLAG_TONE[f.tone]}>
          {f.label}
        </span>
      ))}
    </span>
  );
}
