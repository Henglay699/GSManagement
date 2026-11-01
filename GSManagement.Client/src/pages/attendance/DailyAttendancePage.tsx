import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleDot,
  Clock,
  PartyPopper,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Timer,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { paths } from "../../lib/paths";
import { Permission } from "../../lib/permissions";
import { fmtMinutes } from "../../lib/attendanceDisplay";
import { addDays, todayKey } from "../../utils/dateTimeFormatter";
import { fetchDailyAttendance } from "../../services/attendanceService";
import type { DailyAttendance, DayStatus, SummaryDay, SummaryEmployee } from "../../types/attendance";
import PageHeader from "../../components/ui/PageHeader";
import Alert from "../../components/ui/Alert";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/attendance/StatusBadge";
import ClockRange from "../../components/attendance/ClockRange";
import DayNote from "../../components/attendance/DayNote";
import AttendanceRecordModal from "../../components/attendance/AttendanceRecordModal";
import WeeklyAttendanceGrid from "../../components/attendance/WeeklyAttendanceGrid";

const NOT_EDITABLE: DayStatus[] = ["OnLeave", "Holiday", "DayOff", "Upcoming"];

// HR's attendance board: the weekly grid (default) or one day in detail.
// ?view=day&date=YYYY-MM-DD keeps the choice in the URL.
export default function DailyAttendancePage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") === "day" ? "day" : "week";
  const date = params.get("date") ?? todayKey();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ employee: SummaryEmployee; day: SummaryDay } | null>(null);
  const [weekVersion, setWeekVersion] = useState(0);
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(Permission.UpdateAttendance) || hasPermission(Permission.CreateAttendance);

  const go = (next: { view?: "day" | "week"; date?: string }) => {
    const v = next.view ?? view;
    const d = next.date ?? date;
    const p: Record<string, string> = {};
    if (v === "day") p.view = "day";
    if (d !== todayKey()) p.date = d;
    setParams(p);
  };

  return (
    <div className={`mx-auto max-w-7xl ${view === "day" ? "space-y-4" : "space-y-6 pb-10"}`}>
      <PageHeader
        title="Daily attendance"
        description={
          view === "week"
            ? "Everyone's week at a glance. Click a day to see it in detail, or a cell to correct it."
            : "Who's in, who's late and who's away. Click a figure to filter the list."
        }
        actions={
          <>
            <div className="relative w-56">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee or role"
                className="input pl-9"
              />
            </div>
            <div className="segmented">
              <button aria-pressed={view === "week"} onClick={() => go({ view: "week" })}>
                Week
              </button>
              <button aria-pressed={view === "day"} onClick={() => go({ view: "day" })}>
                Day
              </button>
            </div>
          </>
        }
      />

      {view === "week" ? (
        <WeeklyAttendanceGrid
          date={date}
          onChangeDate={(d) => go({ date: d })}
          onPickDay={(d) => go({ view: "day", date: d })}
          search={search}
          onEdit={canEdit ? (employee, day) => setEditing({ employee, day }) : undefined}
          refreshKey={weekVersion}
        />
      ) : (
        <DayView
          date={date}
          search={search}
          onChangeDate={(d) => go({ date: d })}
          onEdit={canEdit ? (employee, day) => setEditing({ employee, day }) : undefined}
          refreshKey={weekVersion}
        />
      )}

      {editing && (
        <AttendanceRecordModal
          userId={editing.employee.id}
          employeeName={editing.employee.userName}
          day={editing.day}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setWeekVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}

interface DayViewProps {
  date: string;
  search: string;
  onChangeDate: (date: string) => void;
  onEdit?: (employee: SummaryEmployee, day: SummaryDay) => void;
  refreshKey: number;
}

type Row = DailyAttendance["rows"][number];
type SortKey = "name" | "in" | "ot";

// Each summary figure is also a filter on the table.
const ROW_FILTERS: Record<string, { label: string; test: (d: SummaryDay) => boolean }> = {
  all: { label: "Everyone", test: () => true },
  ontime: { label: "On time", test: (d) => !!d.checkInTime && d.lateMinutes === 0 },
  late: { label: "Late clock-in", test: (d) => !!d.checkInTime && d.lateMinutes > 0 },
  early: { label: "Left early", test: (d) => d.earlyLeaveMinutes > 0 },
  absent: { label: "Absent", test: (d) => d.status === "Absent" || d.status === "NoRecord" },
  notin: { label: "Not in yet", test: (d) => d.status === "NotClockedIn" },
  noout: { label: "No clock-out", test: (d) => d.missedClockOut },
  leave: { label: "On leave", test: (d) => d.status === "OnLeave" },
  half: { label: "Half day", test: (d) => d.status === "HalfDay" },
};

// The previous working day to compare with (Saturday when the day is Monday).
function previousWorkday(date: string) {
  const prev = addDays(date, -1);
  return new Date(`${prev}T00:00:00`).getDay() === 0 ? addDays(date, -2) : prev;
}

// "+ 12 vs yesterday": green when the change is good, orange when it isn't.
function delta(now: number, prev: number | undefined, goodWhenUp: boolean | null, vs: string): ReactNode {
  if (prev === undefined) return null;
  const d = now - prev;
  const tone =
    d === 0 || goodWhenUp === null
      ? "text-fg-3"
      : d > 0 === goodWhenUp
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-orange-600 dark:text-orange-400";
  return (
    <>
      <span className={`font-semibold ${tone}`}>{d === 0 ? "0" : `${d > 0 ? "+" : "−"} ${Math.abs(d)}`}</span> {vs}
    </>
  );
}

const TH = "border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-fg-2 dark:border-line dark:bg-subtle";
const TD = "border-b border-slate-100 px-4 py-2 align-middle dark:border-line";
const PAGE_SIZES = [10, 20, 50];

// Figures in the summary strip, grouped like the design (present / not present / away).
const STRIP: { key: string; group: string; dot: string; goodWhenUp: boolean | null }[] = [
  { key: "ontime", group: "Present", dot: "bg-emerald-500", goodWhenUp: true },
  { key: "late", group: "Present", dot: "bg-emerald-500", goodWhenUp: false },
  { key: "early", group: "Present", dot: "bg-emerald-500", goodWhenUp: false },
  { key: "absent", group: "Not present", dot: "bg-rose-500", goodWhenUp: false },
  { key: "notin", group: "Not present", dot: "bg-rose-500", goodWhenUp: false },
  { key: "noout", group: "Not present", dot: "bg-rose-500", goodWhenUp: false },
  { key: "leave", group: "Away", dot: "bg-violet-500", goodWhenUp: null },
  { key: "half", group: "Away", dot: "bg-violet-500", goodWhenUp: null },
];

// One date: grouped summaries (which double as filters) and a row per employee.
function DayView({ date, search, onChangeDate, onEdit, refreshKey }: DayViewProps) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pickerRef = useRef<HTMLInputElement>(null);
  const isToday = date === todayKey();
  const prevDate = previousWorkday(date);

  const { data, loading, error } = useAsync(
    // refreshKey is part of the key so a save reloads the day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => fetchDailyAttendance(date), [date, refreshKey]),
    "Could not load attendance for this day.",
  );
  // For "vs yesterday"; the comparison is simply left out if it fails.
  const { data: prev } = useAsync(
    useCallback(() => fetchDailyAttendance(prevDate).catch(() => null), [prevDate]),
    "",
  );

  const count = (rows: Row[] | undefined, key: string) =>
    rows ? rows.filter((r) => ROW_FILTERS[key]!.test(r.day)).length : undefined;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const test = ROW_FILTERS[filter]!.test;
    const list = (data?.rows ?? []).filter(
      (r) =>
        test(r.day) &&
        (!q || r.employee.userName.toLowerCase().includes(q) || r.employee.roles.toLowerCase().includes(q)),
    );
    const value = (r: Row) =>
      sort.key === "name" ? r.employee.userName.toLowerCase() : sort.key === "in" ? (r.day.checkInTime ?? "~") : r.day.overtimeMinutes;
    return [...list].sort((a, b) => (value(a) < value(b) ? -sort.dir : value(a) > value(b) ? sort.dir : 0));
  }, [data, filter, search, sort]);

  const busy = loading && !data;
  const month = date.slice(0, 7);
  const closed = data && (data.isDayOff || data.holidayName);
  const vs = prevDate === addDays(date, -1) ? "vs yesterday" : `vs ${new Date(`${prevDate}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short" })}`;

  const pick = (key: string) => {
    setFilter((f) => (f === key ? "all" : key));
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * pageSize, current * pageSize);

  const sortHeader = (key: SortKey, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => {
        setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : 1 }));
        setPage(1);
      }}
      className="flex w-full items-center gap-1.5"
    >
      {icon}
      {label}
      <ChevronsUpDown size={12} className={`ml-auto ${sort.key === key ? "text-indigo-500" : "text-fg-3"}`} />
    </button>
  );

  return (
    <>
      {/* Date navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => onChangeDate(addDays(date, -1))} className="btn-icon" aria-label="Previous day">
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => pickerRef.current?.showPicker?.()}
          className="relative rounded-lg px-1.5 text-base font-semibold text-fg hover:text-indigo-600 dark:hover:text-indigo-400"
          title="Pick a date"
        >
          {new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          <input
            ref={pickerRef}
            type="date"
            value={date}
            max={todayKey()}
            onChange={(e) => e.target.value && onChangeDate(e.target.value)}
            className="pointer-events-none absolute inset-0 opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        </button>
        <button onClick={() => onChangeDate(addDays(date, 1))} disabled={isToday} className="btn-icon" aria-label="Next day">
          <ChevronRight size={16} />
        </button>
        {!isToday && (
          <button onClick={() => onChangeDate(todayKey())} className="btn btn-ghost btn-sm">
            Today
          </button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {closed && (
        <div className="card flex items-center gap-3 px-5 py-2.5">
          <PartyPopper size={18} className="text-indigo-600 dark:text-indigo-400" />
          <div className="text-[13px]">
            <span className="font-semibold text-fg">
              {data.holidayName ? `Public holiday: ${data.holidayName}` : "Sunday, day off"}
            </span>
            <span className="text-fg-3"> · No attendance is expected.</span>
          </div>
        </div>
      )}

      {/* Summary strip: each figure filters the list. */}
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-xs sm:grid-cols-4 lg:grid-cols-8 dark:border-line">
        {STRIP.map((m) => {
          const now = count(data?.rows, m.key) ?? 0;
          const active = filter === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => pick(m.key)}
              aria-pressed={active}
              title={`${m.group} · show ${ROW_FILTERS[m.key]!.label.toLowerCase()}`}
              className={`min-w-0 border-b border-r border-slate-100 px-3.5 py-2.5 text-left transition-colors dark:border-line ${
                active
                  ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-950/40 dark:ring-indigo-800"
                  : "hover:bg-slate-50 dark:hover:bg-zinc-800/60"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate text-[11px] text-fg-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} />
                {ROW_FILTERS[m.key]!.label}
              </span>
              {busy ? (
                <span className="skeleton mt-1 block h-5 w-8" />
              ) : (
                <span className="mt-0.5 block text-lg font-semibold tabular-nums leading-tight text-fg">{now}</span>
              )}
              <span className="block h-3.5 truncate text-[10px] text-fg-3">
                {delta(now, count(prev?.rows, m.key), m.goodWhenUp, vs)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-xs dark:border-line">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-line">
          <h2 className="text-sm font-semibold text-fg">{ROW_FILTERS[filter]!.label}</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-fg-2 dark:bg-subtle">
            {rows.length}
          </span>
          {filter !== "all" && (
            <button
              onClick={() => pick("all")}
              className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <X size={12} /> Show everyone
            </button>
          )}
        </div>
        <div className="max-h-[calc(100vh-24rem)] min-h-[260px] overflow-auto">
          {busy ? (
            <div className="h-64 skeleton rounded-none" />
          ) : rows.length === 0 ? (
            <EmptyState icon={<Users size={32} />} title="No one matches">
              Try another filter or clear the search.
            </EmptyState>
          ) : (
            <table className="w-full min-w-[860px] border-separate border-spacing-0 text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={`${TH} w-[24%]`}>{sortHeader("name", "Employee Name", <UserIcon size={13} />)}</th>
                  <th className={`${TH} w-[30%] border-l`}>{sortHeader("in", "Clock-in & Out", <Clock size={13} />)}</th>
                  <th className={`${TH} border-l`}>{sortHeader("ot", "Overtime", <Timer size={13} />)}</th>
                  <th className={`${TH} border-l`}>
                    <span className="flex items-center gap-1.5"><CircleDot size={13} /> Status</span>
                  </th>
                  <th className={`${TH} border-l`}>
                    <span className="flex items-center gap-1.5"><StickyNote size={13} /> Note</span>
                  </th>
                  <th className={`${TH} no-print w-px`} />
                </tr>
              </thead>
              <tbody>
                {pageRows.map(({ employee: emp, day }) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                    <td className={TD}>
                      <Link to={paths.userAttendance(emp.id, month)} className="group flex items-center gap-3">
                        <Avatar name={emp.userName} src={emp.imageUrl} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-fg group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {emp.userName}
                          </span>
                          <span className="block truncate text-xs text-fg-3">
                            #{emp.id}
                            {emp.roles && ` · ${emp.roles}`}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className={`${TD} border-l`}>
                      <ClockRange day={day} />
                    </td>
                    <td className={`${TD} border-l tabular-nums`}>
                      {day.overtimeMinutes > 0 ? (
                        <span className="font-medium text-fg">{fmtMinutes(day.overtimeMinutes)}</span>
                      ) : (
                        <span className="text-fg-3">-</span>
                      )}
                    </td>
                    <td className={`${TD} border-l`}>
                      <StatusBadge status={day.status} />
                    </td>
                    <td className={`${TD} max-w-[16rem] border-l`}>
                      <DayNote day={day} />
                    </td>
                    <td className={`${TD} no-print text-right`}>
                      {onEdit && !NOT_EDITABLE.includes(day.status) && (
                        <button onClick={() => onEdit(emp, day)} className="btn btn-ghost btn-sm">
                          {day.attendanceId ? <Pencil size={14} /> : <Plus size={14} />}
                          {day.attendanceId ? "Edit" : "Add"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2 text-xs text-fg-2 dark:border-line">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-surface px-1.5 py-1 text-xs dark:border-line-strong"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-fg-3">
              {rows.length
                ? `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, rows.length)} of ${rows.length}`
                : "0 of 0"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              className="btn-icon h-7 w-7"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === pageCount || Math.abs(n - current) <= 1)
              .map((n, i, list) => (
                <span key={n} className="flex items-center gap-1">
                  {i > 0 && n - list[i - 1]! > 1 && <span className="px-1 text-fg-3">…</span>}
                  <button
                    onClick={() => setPage(n)}
                    aria-current={n === current ? "page" : undefined}
                    className={`h-7 min-w-7 rounded-lg px-2 font-medium ${
                      n === current ? "bg-indigo-600 text-white" : "text-fg-2 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount}
              className="btn-icon h-7 w-7"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
