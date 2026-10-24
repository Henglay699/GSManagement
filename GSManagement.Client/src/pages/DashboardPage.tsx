import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileBarChart2,
  Table,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks/useAsync";
import { paths } from "../lib/paths";
import { Permission } from "../lib/permissions";
import { fmtNumber, fmtTime, monthLabel, shortDate } from "../lib/attendanceDisplay";
import { todayKey } from "../utils/dateTimeFormatter";
import { fetchDailyAttendance } from "../services/attendanceService";
import { fetchLeaveRequests } from "../services/leaveService";
import { fetchMonthlyReport } from "../services/reportService";
import type { DayStatus } from "../types/attendance";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Alert from "../components/ui/Alert";
import Avatar from "../components/ui/Avatar";
import EmptyState from "../components/ui/EmptyState";
import { DayFlags, DayStatusChip } from "../components/attendance/DayStatusChip";
import { HalfDayBadge } from "../components/leave/LeaveStatusBadge";

// Today's exceptions HR usually acts on.
const NEEDS_LOOK: DayStatus[] = ["Late", "Absent", "NotClockedIn", "NoRecord"];

// HR overview. Routed behind ViewAttendance; employees start on "Today".
export default function DashboardPage() {
  const { hasPermission } = useAuth();
  const canViewLeave = hasPermission(Permission.ViewLeave);
  const today = todayKey();
  const [year, month] = today.split("-").map(Number) as [number, number];

  const daily = useAsync(useCallback(() => fetchDailyAttendance(today), [today]), "Could not load today's attendance.");
  const report = useAsync(useCallback(() => fetchMonthlyReport(year, month), [year, month]), "Could not load this month.");
  const pending = useAsync(
    useCallback(
      () => (canViewLeave ? fetchLeaveRequests({ status: "Pending", pageNumber: 1, pageSize: 6 }) : Promise.resolve(null)),
      [canViewLeave],
    ),
    "Could not load pending leave.",
  );

  const c = daily.data?.counts;
  const sum = (...s: DayStatus[]) => s.reduce((n, st) => n + (c?.[st] ?? 0), 0);
  const busy = daily.loading && !daily.data;
  const m = report.data?.totals;
  const exceptions = (daily.data?.rows ?? []).filter((r) => NEEDS_LOOK.includes(r.day.status) || r.day.earlyLeaveMinutes > 0);
  const lowest = [...(report.data?.employees ?? [])]
    .sort((a, b) => a.totals.attendanceRate - b.totals.attendanceRate)
    .slice(0, 5);
  const error = daily.error ?? report.error ?? pending.error;

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      <PageHeader
        eyebrow="HR"
        title="Overview"
        description={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <>
            <Link to={paths.attendance} className="btn btn-secondary">
              <Table size={16} /> Daily attendance
            </Link>
            <Link to={paths.monthlyReport} className="btn btn-primary">
              <FileBarChart2 size={16} /> Monthly report
            </Link>
          </>
        }
      />

      {error && <Alert>{error}</Alert>}

      <section className="space-y-3">
        <h2 className="section-label">Today</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Present" value={sum("Present", "InProgress", "Late")} hint={`of ${daily.data?.rows.length ?? 0} employees`} tone="success" loading={busy} />
          <StatCard label="Late" value={sum("Late")} tone="warning" loading={busy} />
          <StatCard label="On leave" value={sum("OnLeave", "HalfDay")} hint={c?.HalfDay ? `${c.HalfDay} half day` : undefined} tone="violet" loading={busy} />
          <StatCard label="Absent" value={sum("Absent", "NoRecord")} tone="danger" loading={busy} />
          <StatCard label="Not in yet" value={sum("NotClockedIn")} tone="muted" loading={busy} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="card-title">Needs a look today</h2>
            <Link to={paths.attendance} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              All employees <ArrowRight size={12} />
            </Link>
          </div>
          {busy ? (
            <div className="h-48 animate-pulse bg-subtle" />
          ) : exceptions.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={30} className="text-emerald-500" />} title="Everyone is accounted for" />
          ) : (
            <ul className="max-h-[360px] divide-y divide-slate-100 overflow-auto dark:divide-zinc-800">
              {exceptions.map(({ employee: e, day }) => (
                <li key={e.id}>
                  <Link
                    to={paths.userAttendance(e.id, today.slice(0, 7))}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-subtle"
                  >
                    <Avatar name={e.userName} src={e.imageUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-fg">{e.userName}</span>
                      <span className="block text-xs text-fg-3">
                        {day.checkInTime ? `In at ${fmtTime(day.checkInTime)}` : e.roles}
                      </span>
                      <DayFlags day={day} />
                    </span>
                    <DayStatusChip status={day.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canViewLeave && (
          <div className="card overflow-hidden">
            <div className="card-header">
              <h2 className="card-title">
                Leave to review
                {!!pending.data?.totalCount && (
                  <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {pending.data.totalCount}
                  </span>
                )}
              </h2>
              <Link to={paths.leaveRequests} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                Review <ArrowRight size={12} />
              </Link>
            </div>
            {!pending.data?.items.length ? (
              <EmptyState icon={<CheckCircle2 size={30} className="text-emerald-500" />} title="Nothing waiting">
                New requests appear here as they arrive.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {pending.data.items.map((lr) => (
                  <li key={lr.id}>
                    <Link to={paths.leaveDetail(lr.id)} className="flex items-center gap-3 px-5 py-3 hover:bg-subtle">
                      <Avatar name={lr.userName} src={lr.userImageUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-fg">{lr.userName}</span>
                        <span className="flex items-center gap-1.5 text-xs text-fg-3">
                          {lr.leaveType} · {shortDate(lr.startDate)}
                          {lr.endDate !== lr.startDate && ` – ${shortDate(lr.endDate)}`}
                          {lr.isHalfDay && <HalfDayBadge period={lr.halfDayPeriod} />}
                        </span>
                      </span>
                      <ArrowRight size={14} className="text-slate-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-label">{monthLabel(year, month)} so far</h2>
          <Link to={paths.monthlyReport} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
            Full report <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Attendance" value={`${fmtNumber(m?.averageAttendanceRate ?? 0)}%`} hint={report.data ? `${report.data.workingDays} working days` : undefined} tone="success" loading={report.loading && !report.data} />
          <StatCard label="On time" value={`${fmtNumber(m?.averagePunctualityRate ?? 0)}%`} hint={m ? `${m.lateDays} late arrivals` : undefined} tone="warning" loading={report.loading && !report.data} />
          <StatCard label="Hours worked" value={fmtNumber(m?.workedHours ?? 0, 0)} tone="brand" loading={report.loading && !report.data} />
          <StatCard label="Overtime" value={`${fmtNumber(m?.overtimeHours ?? 0)}h`} tone="brand" loading={report.loading && !report.data} />
          <StatCard label="Leave days" value={fmtNumber(m?.leaveDays ?? 0)} tone="violet" loading={report.loading && !report.data} />
          <StatCard label="Absent days" value={m?.absentDays ?? 0} hint={m?.missedClockOuts ? `${m.missedClockOuts} missed clock-outs` : undefined} tone="danger" loading={report.loading && !report.data} />
        </div>
      </section>

      {lowest.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="card-title">Lowest attendance this month</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="num">Attendance</th>
                <th className="num">Late</th>
                <th className="num">Absent</th>
                <th className="num">Leave</th>
              </tr>
            </thead>
            <tbody>
              {lowest.map(({ employee: e, totals: t }) => (
                <tr key={e.id}>
                  <td>
                    <Link to={paths.userAttendance(e.id, today.slice(0, 7))} className="flex items-center gap-3 font-medium text-slate-900 hover:text-indigo-700 dark:text-white">
                      <Avatar name={e.userName} src={e.imageUrl} size="sm" />
                      {e.userName}
                    </Link>
                  </td>
                  <td className="num font-medium">{fmtNumber(t.attendanceRate)}%</td>
                  <td className="num">{t.lateDays}</td>
                  <td className="num">{t.absentDays}</td>
                  <td className="num">{fmtNumber(t.leaveDays)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
