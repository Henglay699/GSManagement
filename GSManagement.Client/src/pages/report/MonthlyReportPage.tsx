import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  ChevronsUpDown,
  Clock,
  Download,
  Flame,
  Loader2,
  Printer,
  Search,
  TrendingUp,
  Users,
  UserX,
} from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { fmtMinutes, fmtNumber, monthLabel } from "../../lib/attendanceDisplay";
import { printDocument } from "../../lib/print";
import { downloadMonthlyReportExcel, fetchMonthlyReport } from "../../services/reportService";
import { LEAVE_TYPES } from "../../types/leave";
import type { SummaryTotals } from "../../types/attendance";
import type { MonthlyReport, MonthlyReportRow } from "../../types/report";
import MonthPicker from "../../components/ui/MonthPicker";
import Alert from "../../components/ui/Alert";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import AttendanceRing from "../../components/attendance/AttendanceRing";
import MonthlyReportPrintSheet from "../../components/report/MonthlyReportPrintSheet";

type SortKey =
  | "name"
  | keyof Pick<
      SummaryTotals,
      | "presentDays"
      | "attendanceRate"
      | "punctualityRate"
      | "lateDays"
      | "absentDays"
      | "leaveDays"
      | "missedClockOuts"
      | "workedHours"
      | "overtimeHours"
    >;
type Sort = { key: SortKey; desc: boolean };

// Attendance colour: green from 95%, amber from 85%, red below.
const rateTone = (r: number) => (r >= 95 ? "bg-emerald-500" : r >= 85 ? "bg-amber-500" : "bg-rose-500");
const needsAttention = (t: SummaryTotals) => t.absentDays > 0 || t.lateDays >= 3 || t.missedClockOuts > 0;

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

// HR's month-end report: the team at a glance, who needs attention, and every
// employee's month side by side.
export default function MonthlyReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const [sort, setSort] = useState<Sort>({ key: "name", desc: false });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, loading, error } = useAsync(
    useCallback(() => fetchMonthlyReport(year, month), [year, month]),
    "Could not load the monthly report.",
  );

  async function exportExcel() {
    setExporting(true);
    setExportError(null);
    try {
      await downloadMonthlyReportExcel(year, month);
    } catch (err) {
      setExportError(getErrorMessage(err, "Could not export the report."));
    } finally {
      setExporting(false);
    }
  }

  const employees = useMemo(() => data?.employees ?? [], [data]);
  const flagged = useMemo(() => employees.filter((r) => needsAttention(r.totals)), [employees]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (filter === "attention" ? flagged : employees).filter(
      (r) => !q || r.employee.userName.toLowerCase().includes(q) || r.employee.roles.toLowerCase().includes(q),
    );
    const dir = sort.desc ? -1 : 1;
    return [...list].sort((a, b) =>
      sort.key === "name"
        ? a.employee.userName.localeCompare(b.employee.userName) * dir
        : (a.totals[sort.key] - b.totals[sort.key]) * dir,
    );
  }, [employees, flagged, filter, search, sort]);

  const busy = loading && !data;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="mx-auto max-w-7xl pb-10">
      {data && <MonthlyReportPrintSheet report={data} />}

      <div className="no-print space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Staff attendance · Report
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-zinc-100">
              Monthly report · {monthLabel(year, month)}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
              {data
                ? `${data.workingDays} working days${isCurrent ? " so far" : ""} · Monday to Saturday, excluding public holidays`
                : " "}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker
              year={year}
              month={month}
              onChange={(y, m) => {
                setYear(y);
                setMonth(m);
              }}
            />
            <button
              onClick={() => printDocument(`Attendance-Report-${monthKey}`)}
              disabled={!data}
              className="btn btn-secondary btn-sm"
            >
              <Printer size={15} /> Print
            </button>
            <button onClick={exportExcel} disabled={exporting || !data} className="btn btn-primary btn-sm">
              {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Export to Excel
            </button>
          </div>
        </div>

        {(exportError ?? error) && <Alert>{exportError ?? error}</Alert>}

        {/* Overview + side column */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <TeamOverview report={data} busy={busy} />

          <div className="space-y-5">
            <div className={card}>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-zinc-800">
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Needs attention</span>
                {flagged.length > 0 && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    {flagged.length}
                  </span>
                )}
              </div>
              <AttentionList rows={flagged} monthKey={monthKey} busy={busy} />
            </div>

            <div className={`${card} p-5`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Leave by type</span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">approved working days</span>
              </div>
              <LeaveByType rows={employees} />
            </div>
          </div>
        </div>

        {/* Employees */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Employees</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                {rows.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="segmented">
                <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
                  All
                </button>
                <button aria-pressed={filter === "attention"} onClick={() => setFilter("attention")}>
                  Needs attention
                  {flagged.length > 0 && <span className="ml-1.5 text-rose-600">{flagged.length}</span>}
                </button>
              </div>
              <div className="relative w-56">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee or role"
                  className="input h-9 pl-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto">
            {busy ? (
              <div className="h-64 animate-pulse bg-slate-50 dark:bg-zinc-800/50" />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<Users size={32} />}
                title={
                  search ? "No one matches your search" : filter === "attention" ? "Nobody to flag" : "No active employees"
                }
              />
            ) : (
              <EmployeeTable rows={rows} sort={sort} onSort={setSort} monthKey={monthKey} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ overview

function TeamOverview({ report: r, busy }: { report: MonthlyReport | undefined; busy: boolean }) {
  const t = r?.totals;
  const onTime = t ? Math.max(0, t.presentDays - t.lateDays) : 0;
  const segments = t
    ? [
        { label: "On time", value: onTime, color: "bg-emerald-500" },
        { label: "Late", value: t.lateDays, color: "bg-amber-500" },
        { label: "Absent", value: t.absentDays, color: "bg-rose-500" },
        { label: "Leave", value: t.leaveDays, color: "bg-purple-500" },
      ]
    : [];
  const total = segments.reduce((s, x) => s + x.value, 0);

  return (
    <div className={`${card} p-6 lg:col-span-2`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Team overview
          </span>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">
            {t ? `${t.employees} active employee${t.employees === 1 ? "" : "s"}` : " "}
          </p>
        </div>
      </div>

      {busy || !t ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-50 dark:bg-zinc-800/50" />
      ) : (
        <>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="flex flex-col items-center gap-1.5">
              <AttendanceRing percent={t.averageAttendanceRate} size="lg" />
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">average attendance</span>
            </div>

            <div className="grid w-full flex-1 grid-cols-2 gap-3">
              <Figure
                icon={<TrendingUp size={14} className="text-blue-500" />}
                label="On-time rate"
                value={`${fmtNumber(t.averagePunctualityRate)}%`}
                note={`${t.lateDays} late arrival${t.lateDays === 1 ? "" : "s"}`}
              />
              <Figure
                icon={<Clock size={14} className="text-emerald-500" />}
                label="Hours worked"
                value={fmtNumber(t.workedHours, 0)}
                note={t.employees ? `${fmtNumber(t.workedHours / t.employees)}h per employee` : "–"}
              />
              <Figure
                icon={<Flame size={14} className="text-amber-500" />}
                label="Overtime"
                value={`+${fmtNumber(t.overtimeHours)}h`}
                valueClass="text-amber-600 dark:text-amber-400"
                note={`${t.earlyLeaveDays} early departure${t.earlyLeaveDays === 1 ? "" : "s"}`}
              />
              <Figure
                icon={<UserX size={14} className="text-rose-500" />}
                label="Absent days"
                value={String(t.absentDays)}
                valueClass={t.absentDays ? "text-rose-600 dark:text-rose-400" : undefined}
                note={`${t.missedClockOuts} missed clock-out${t.missedClockOuts === 1 ? "" : "s"}`}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-zinc-300">How the team's days went</span>
              <span className="text-slate-400 dark:text-zinc-500">{fmtNumber(total)} employee-days</span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              {total > 0 &&
                segments.map(
                  (s) =>
                    s.value > 0 && (
                      <div
                        key={s.label}
                        className={`${s.color} h-full motion-safe:transition-all motion-safe:duration-500`}
                        style={{ width: `${(s.value / total) * 100}%` }}
                        title={`${s.label}: ${fmtNumber(s.value)}`}
                      />
                    ),
                )}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                  <span className={`h-2 w-2 shrink-0 rounded-sm ${s.color}`} />
                  <span className="font-semibold text-slate-800 dark:text-zinc-100">{fmtNumber(s.value)}</span>
                  <span>{s.label}</span>
                  {total > 0 && <span className="text-slate-400">({Math.round((s.value / total) * 100)}%)</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Figure({
  icon,
  label,
  value,
  note,
  valueClass = "text-slate-900 dark:text-zinc-100",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  valueClass?: string;
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-extrabold tabular-nums ${valueClass}`}>{value}</div>
      <p className="text-[11px] text-slate-400">{note}</p>
    </div>
  );
}

// ------------------------------------------------------------- side column

function AttentionList({ rows, monthKey, busy }: { rows: MonthlyReportRow[]; monthKey: string; busy: boolean }) {
  if (busy) return <div className="m-4 h-32 animate-pulse rounded-xl bg-slate-50 dark:bg-zinc-800/50" />;
  const list = [...rows].sort((a, b) => a.totals.attendanceRate - b.totals.attendanceRate).slice(0, 6);
  if (!list.length)
    return (
      <p className="px-5 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
        No absences, frequent lateness or missed clock-outs this month.
      </p>
    );
  return (
    <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
      {list.map(({ employee: e, totals: t }) => (
        <li key={e.id}>
          <Link
            to={paths.userAttendance(e.id, monthKey)}
            className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/60"
          >
            <Avatar name={e.userName} src={e.imageUrl} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-slate-800 dark:text-zinc-100">{e.userName}</span>
              <span className="flex flex-wrap gap-1 pt-0.5">
                {t.absentDays > 0 && <Chip tone="rose">{t.absentDays} absent</Chip>}
                {t.lateDays > 0 && <Chip tone="amber">{t.lateDays} late</Chip>}
                {t.missedClockOuts > 0 && <Chip tone="slate">{t.missedClockOuts} missed out</Chip>}
              </span>
            </span>
            <span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-zinc-300">
              {fmtNumber(t.attendanceRate)}%
            </span>
          </Link>
        </li>
      ))}
      {rows.length > list.length && (
        <li className="px-5 py-2 text-center text-[11px] text-slate-400">+{rows.length - list.length} more in the table below</li>
      )}
    </ul>
  );
}

function Chip({ tone, children }: { tone: "rose" | "amber" | "slate"; children: ReactNode }) {
  const tones = {
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return <span className={`rounded-md px-1.5 py-px text-[10px] font-semibold ${tones[tone]}`}>{children}</span>;
}

function LeaveByType({ rows }: { rows: MonthlyReportRow[] }) {
  const totals = LEAVE_TYPES.map((type) => ({
    type,
    days: rows.reduce((s, r) => s + (r.totals.leaveByType[type] ?? 0), 0),
  }));
  const max = Math.max(1, ...totals.map((l) => l.days));
  return (
    <div className="space-y-3">
      {totals.map((l) => (
        <div key={l.type} className="flex items-center gap-3 text-xs">
          <span className="w-20 shrink-0 text-slate-500 dark:text-zinc-400">{l.type}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${(l.days / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right font-semibold tabular-nums text-slate-800 dark:text-zinc-100">
            {fmtNumber(l.days)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------- table

function EmployeeTable({
  rows,
  sort,
  onSort,
  monthKey,
}: {
  rows: MonthlyReportRow[];
  sort: Sort;
  onSort: (s: Sort) => void;
  monthKey: string;
}) {
  const navigate = useNavigate();
  const h = (k: SortKey, label: string, num = true) => <SortHeader k={k} label={label} num={num} sort={sort} onSort={onSort} />;
  const zero = <span className="text-slate-300 dark:text-zinc-600">0</span>;

  return (
    <table className="table">
      <thead>
        <tr>
          {h("name", "Employee", false)}
          {h("attendanceRate", "Attendance", false)}
          {h("presentDays", "Days")}
          {h("punctualityRate", "On time")}
          {h("lateDays", "Late")}
          {h("absentDays", "Absent")}
          {h("leaveDays", "Leave")}
          {h("missedClockOuts", "Missed out")}
          {h("workedHours", "Hours")}
          {h("overtimeHours", "Overtime")}
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map(({ employee: e, totals: t }) => (
          <tr
            key={e.id}
            onClick={() => navigate(paths.userAttendance(e.id, monthKey))}
            className="group cursor-pointer"
          >
            <td>
              <span className="flex items-center gap-3">
                <Avatar name={e.userName} src={e.imageUrl} />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                    {e.userName}
                  </span>
                  <span className="block truncate text-xs text-slate-400 dark:text-zinc-500">{e.roles || e.email}</span>
                </span>
              </span>
            </td>
            <td>
              <div className="flex min-w-32 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div className={`h-full rounded-full ${rateTone(t.attendanceRate)}`} style={{ width: `${Math.min(100, t.attendanceRate)}%` }} />
                </div>
                <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-800 dark:text-zinc-100">
                  {fmtNumber(t.attendanceRate)}%
                </span>
              </div>
            </td>
            <td className="num">
              {t.presentDays}
              <span className="text-slate-400">/{t.workingDays}</span>
            </td>
            <td className="num">{fmtNumber(t.punctualityRate)}%</td>
            <td className="num" title={t.lateMinutes ? `${fmtMinutes(t.lateMinutes)} in total` : undefined}>
              {t.lateDays ? <span className="font-semibold text-amber-600 dark:text-amber-400">{t.lateDays}</span> : zero}
            </td>
            <td className="num">
              {t.absentDays ? <span className="font-semibold text-rose-600 dark:text-rose-400">{t.absentDays}</span> : zero}
            </td>
            <td
              className="num"
              title={LEAVE_TYPES.filter((lt) => t.leaveByType[lt])
                .map((lt) => `${lt}: ${fmtNumber(t.leaveByType[lt])}`)
                .join(", ")}
            >
              {t.leaveDays ? fmtNumber(t.leaveDays) : zero}
            </td>
            <td className="num">
              {t.missedClockOuts ? (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={12} />
                  {t.missedClockOuts}
                </span>
              ) : (
                zero
              )}
            </td>
            <td className="num font-semibold text-slate-800 dark:text-zinc-100">{fmtNumber(t.workedHours)}</td>
            <td className="num">
              {t.overtimeHours ? (
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                  +{fmtNumber(t.overtimeHours)}h
                </span>
              ) : (
                <span className="text-slate-300 dark:text-zinc-600">–</span>
              )}
            </td>
            <td className="w-8 text-right">
              <ChevronRight size={15} className="text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-zinc-600" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SortHeader({
  k,
  label,
  num,
  sort,
  onSort,
}: {
  k: SortKey;
  label: string;
  num?: boolean;
  sort: Sort;
  onSort: (s: Sort) => void;
}) {
  const active = sort.key === k;
  const Icon = !active ? ChevronsUpDown : sort.desc ? ChevronsDown : ChevronsUp;
  return (
    <th className={num ? "num" : undefined}>
      <button
        // Numbers sort high-to-low first; names A to Z.
        onClick={() => onSort({ key: k, desc: active ? !sort.desc : k !== "name" })}
        className={`inline-flex items-center gap-1 uppercase tracking-[0.06em] hover:text-slate-900 dark:hover:text-white ${
          active ? "text-slate-900 dark:text-white" : ""
        }`}
      >
        {label}
        <Icon size={12} className={active ? "" : "opacity-40"} />
      </button>
    </th>
  );
}
