import { fmtMinutes, fmtNumber, monthLabel } from "../../lib/attendanceDisplay";
import { LEAVE_TYPES } from "../../types/leave";
import type { MonthlyReport } from "../../types/report";
import PrintDocument from "./PrintDocument";

const fmtDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dash = (n: number, f: (n: number) => string = String) => (n ? f(n) : "–");

/** The whole company's month, laid out for printing on landscape A4. */
export default function MonthlyReportPrintSheet({ report: r }: { report: MonthlyReport }) {
  const t = r.totals;
  const start = `${r.year}-${String(r.month).padStart(2, "0")}-01`;
  const rows = [...r.employees].sort((a, b) => a.employee.userName.localeCompare(b.employee.userName));
  const sum = (pick: (x: (typeof rows)[number]["totals"]) => number) => rows.reduce((acc, x) => acc + pick(x.totals), 0);
  const leave = LEAVE_TYPES.map((lt) => `${lt} ${fmtNumber(sum((x) => x.leaveByType[lt] ?? 0))}`).join(" · ");

  return (
    <PrintDocument
      landscape
      title="Monthly Attendance Report"
      meta={[
        ["Period", `${monthLabel(r.year, r.month)} (${fmtDate(start)} – ${fmtDate(r.periodEnd)})`],
        ["Working days", `${r.workingDays} (Mon–Sat, excl. public holidays)`],
        ["Employees", t.employees],
        ["Leave by type (days)", leave],
      ]}
      figures={[
        ["Avg. attendance", `${fmtNumber(t.averageAttendanceRate)}%`],
        ["Avg. punctuality", `${fmtNumber(t.averagePunctualityRate)}%`],
        ["Hours worked", fmtNumber(t.workedHours, 0)],
        ["Overtime", `${fmtNumber(t.overtimeHours)}h`],
        ["Late arrivals", t.lateDays],
        ["Absent days", t.absentDays],
        ["Leave days", fmtNumber(t.leaveDays)],
        ["Missed clock-outs", t.missedClockOuts],
      ]}
      signatures={["Prepared by (HR)", "Checked by", "Approved by"]}
    >
      <table className="pd-table">
        <thead>
          <tr>
            <th className="num">No.</th>
            <th>Employee</th>
            <th className="num">Attendance</th>
            <th className="num">Present</th>
            <th className="num">On time</th>
            <th className="num">Late</th>
            <th className="num">Late time</th>
            <th className="num">Absent</th>
            <th className="num">Leave</th>
            <th className="num">Left early</th>
            <th className="num">Missed out</th>
            <th className="num">Hours</th>
            <th className="num">Overtime</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ employee: e, totals: x }, i) => (
            <tr key={e.id}>
              <td className="num">{i + 1}</td>
              <td>
                <strong>{e.userName}</strong>
                <span className="pd-sub">{e.roles || e.email}</span>
              </td>
              <td className={`num ${x.attendanceRate < 85 ? "pd-bad" : x.attendanceRate < 95 ? "pd-warn" : ""}`}>
                {fmtNumber(x.attendanceRate)}%
              </td>
              <td className="num">
                {x.presentDays}
                <span className="muted-text">/{x.workingDays}</span>
              </td>
              <td className="num">{fmtNumber(x.punctualityRate)}%</td>
              <td className={`num ${x.lateDays ? "pd-warn" : ""}`}>{dash(x.lateDays)}</td>
              <td className="num">{dash(x.lateMinutes, fmtMinutes)}</td>
              <td className={`num ${x.absentDays ? "pd-bad" : ""}`}>{dash(x.absentDays)}</td>
              <td className="num">{dash(x.leaveDays, fmtNumber)}</td>
              <td className="num">{dash(x.earlyLeaveDays)}</td>
              <td className="num">{dash(x.missedClockOuts)}</td>
              <td className="num">{fmtNumber(x.workedHours)}</td>
              <td className="num">{x.overtimeHours ? `+${fmtNumber(x.overtimeHours)}h` : "–"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td>Total · average</td>
            <td className="num">{fmtNumber(t.averageAttendanceRate)}%</td>
            <td className="num">{t.presentDays}</td>
            <td className="num">{fmtNumber(t.averagePunctualityRate)}%</td>
            <td className="num">{t.lateDays}</td>
            <td className="num">{dash(sum((x) => x.lateMinutes), fmtMinutes)}</td>
            <td className="num">{t.absentDays}</td>
            <td className="num">{fmtNumber(t.leaveDays)}</td>
            <td className="num">{t.earlyLeaveDays}</td>
            <td className="num">{t.missedClockOuts}</td>
            <td className="num">{fmtNumber(t.workedHours)}</td>
            <td className="num">{t.overtimeHours ? `+${fmtNumber(t.overtimeHours)}h` : "–"}</td>
          </tr>
        </tfoot>
      </table>
    </PrintDocument>
  );
}
