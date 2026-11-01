import { fmtMinutes } from "../../lib/attendanceDisplay";
import type { SummaryDay } from "../../types/attendance";

// The table's Note column: leave, holiday, early leave and HR's remark, on one line.
export default function DayNote({ day }: { day: SummaryDay }) {
  const parts = [
    day.leaveType &&
      `${day.leaveType} leave${day.halfDayPeriod ? ` (${day.halfDayPeriod.toLowerCase()})` : ""}`,
    day.holidayName,
    day.earlyLeaveMinutes > 0 && `Left ${fmtMinutes(day.earlyLeaveMinutes)} early`,
    day.remark,
  ].filter(Boolean) as string[];

  if (!parts.length) return <span className="text-fg-3">-</span>;
  const text = parts.join(" · ");
  return (
    <span className="block truncate text-fg-2" title={text}>
      {text}
    </span>
  );
}
