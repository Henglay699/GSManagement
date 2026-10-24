import { DAY_STATUS, fmtMinutes, fmtNumber, fmtTime, monthLabel } from "../../lib/attendanceDisplay";
import { LEAVE_TYPES } from "../../types/leave";
import type { MonthSummary, SummaryDay } from "../../types/attendance";
import PrintDocument from "./PrintDocument";

const fmtDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtWeekday = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
const dash = (n: number, f: (n: number) => string = String) => (n ? f(n) : "–");

function notes(d: SummaryDay) {
  return [
    d.holidayName,
    d.leaveType && `${d.leaveType} leave${d.halfDayPeriod ? ` (${d.halfDayPeriod.toLowerCase()})` : ""}`,
    d.missedClockOut && "Missed clock-out",
    d.remark,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** One employee's month, laid out for printing on A4. */
export default function AttendancePrintSheet({ summary: s }: { summary: MonthSummary }) {
  const { employee: e, totals: t } = s;
  const days = s.days.filter((d) => d.status !== "Upcoming");
  const sum = (pick: (d: SummaryDay) => number) => days.reduce((acc, d) => acc + pick(d), 0);
  const start = `${s.year}-${String(s.month).padStart(2, "0")}-01`;
  const leave = LEAVE_TYPES.filter((lt) => t.leaveByType[lt])
    .map((lt) => `${lt} ${fmtNumber(t.leaveByType[lt])}`)
    .join(", ");

  return (
    <PrintDocument
      title="Employee Attendance Record"
      meta={[
        ["Employee", e.userName],
        ["Email", e.email],
        ["Role", e.roles || "–"],
        ["Period", `${monthLabel(s.year, s.month)} (${fmtDate(start)} – ${fmtDate(s.periodEnd)})`],
        ["Working days", t.workingDays],
      ]}
      figures={[
        ["Attendance", `${fmtNumber(t.attendanceRate)}%`],
        ["Punctuality", `${fmtNumber(t.punctualityRate)}%`],
        ["Present", `${t.presentDays} / ${t.workingDays}`],
        ["Late", `${t.lateDays}d · ${fmtMinutes(t.lateMinutes)}`],
        ["Absent", `${t.absentDays}d`],
        ["Leave", `${fmtNumber(t.leaveDays)}d`],
        ["Hours worked", `${fmtNumber(t.workedHours)}h`],
        ["Overtime", `${fmtNumber(t.overtimeHours)}h`],
        ["Left early", `${t.earlyLeaveDays}d`],
        ["Missed clock-outs", t.missedClockOuts],
      ]}
      signatures={["Employee", "Prepared by (HR)", "Approved by"]}
    >
      <div className="pd-section">Daily record{leave && <span className="pd-sub">Leave taken: {leave}</span>}</div>
      <table className="pd-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Status</th>
            <th className="num">In</th>
            <th className="num">Out</th>
            <th className="num">Worked</th>
            <th className="num">Late</th>
            <th className="num">Left early</th>
            <th className="num">Overtime</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date} className={d.status === "DayOff" || d.status === "Holiday" ? "muted" : undefined}>
              <td className="num" style={{ textAlign: "left" }}>{fmtDate(d.date)}</td>
              <td>{fmtWeekday(d.date)}</td>
              <td>
                <span className="pd-status" data-s={d.status}>
                  {DAY_STATUS[d.status].label}
                </span>
              </td>
              <td className="num">{d.checkInTime ? fmtTime(d.checkInTime) : "–"}</td>
              <td className="num">
                {d.missedClockOut ? <span className="pd-bad">Missed</span> : d.checkOutTime ? fmtTime(d.checkOutTime) : "–"}
              </td>
              <td className="num">{dash(d.workedMinutes, fmtMinutes)}</td>
              <td className={`num ${d.lateMinutes ? "pd-warn" : ""}`}>{dash(d.lateMinutes, fmtMinutes)}</td>
              <td className={`num ${d.earlyLeaveMinutes ? "pd-warn" : ""}`}>{dash(d.earlyLeaveMinutes, fmtMinutes)}</td>
              <td className="num">{dash(d.overtimeMinutes, fmtMinutes)}</td>
              <td>{notes(d)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>Total</td>
            <td className="num">{fmtMinutes(sum((d) => d.workedMinutes))}</td>
            <td className="num">{dash(t.lateMinutes, fmtMinutes)}</td>
            <td className="num">{dash(sum((d) => d.earlyLeaveMinutes), fmtMinutes)}</td>
            <td className="num">{dash(sum((d) => d.overtimeMinutes), fmtMinutes)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </PrintDocument>
  );
}
