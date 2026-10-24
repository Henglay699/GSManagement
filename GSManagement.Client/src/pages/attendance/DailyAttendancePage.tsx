import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, PartyPopper, Pencil, Plus, Search, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { paths } from "../../lib/paths";
import { Permission } from "../../lib/permissions";
import { fmtMinutes, fmtTime } from "../../lib/attendanceDisplay";
import { addDays, todayKey } from "../../utils/dateTimeFormatter";
import { fetchDailyAttendance } from "../../services/attendanceService";
import type { DayStatus, SummaryDay, SummaryEmployee } from "../../types/attendance";
import PageHeader from "../../components/ui/PageHeader";
import StatCard, { type StatTone } from "../../components/ui/StatCard";
import Alert from "../../components/ui/Alert";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import StatusLegend from "../../components/attendance/StatusLegend";
import { DayFlags, DayStatusChip } from "../../components/attendance/DayStatusChip";
import AttendanceRecordModal from "../../components/attendance/AttendanceRecordModal";
import WeeklyAttendanceGrid from "../../components/attendance/WeeklyAttendanceGrid";

// Filter tiles: which statuses each one covers.
const FILTERS: { key: string; label: string; tone: StatTone; statuses: DayStatus[] }[] = [
  { key: "all", label: "Everyone", tone: "default", statuses: [] },
  { key: "present", label: "Present", tone: "success", statuses: ["Present", "InProgress"] },
  { key: "late", label: "Late", tone: "warning", statuses: ["Late"] },
  { key: "leave", label: "On leave", tone: "violet", statuses: ["OnLeave", "HalfDay"] },
  { key: "absent", label: "Absent", tone: "danger", statuses: ["Absent", "NoRecord"] },
  { key: "missing", label: "Not in yet", tone: "muted", statuses: ["NotClockedIn"] },
];

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
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <PageHeader
        title="Daily attendance"
        description={
          view === "week"
            ? "Everyone's week at a glance. Click a day to see it in detail, or a cell to correct it."
            : new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
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

// One date: status tiles (which double as filters) and a row per employee.
function DayView({ date, search, onChangeDate, onEdit, refreshKey }: DayViewProps) {
  const [filter, setFilter] = useState("all");
  const isToday = date === todayKey();

  const { data, loading, error } = useAsync(
    // refreshKey is part of the key so a save reloads the day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => fetchDailyAttendance(date), [date, refreshKey]),
    "Could not load attendance for this day.",
  );

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    const q = search.trim().toLowerCase();
    return (data?.rows ?? []).filter(
      (r) =>
        (!f.statuses.length || f.statuses.includes(r.day.status)) &&
        (!q || r.employee.userName.toLowerCase().includes(q) || r.employee.roles.toLowerCase().includes(q)),
    );
  }, [data, filter, search]);

  const count = (statuses: DayStatus[]) =>
    statuses.length ? statuses.reduce((s, st) => s + (data?.counts[st] ?? 0), 0) : (data?.rows.length ?? 0);

  const busy = loading && !data;
  const month = date.slice(0, 7);
  const closed = data && (data.isDayOff || data.holidayName);

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => onChangeDate(addDays(date, -1))} className="btn-icon" aria-label="Previous day">
          <ChevronLeft size={16} />
        </button>
        <input
          type="date"
          value={date}
          max={todayKey()}
          onChange={(e) => e.target.value && onChangeDate(e.target.value)}
          className="input w-40"
        />
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
        <div className="card flex items-center gap-3 px-5 py-4">
          <PartyPopper size={22} className="text-indigo-600 dark:text-indigo-400" />
          <div className="text-[13px]">
            <span className="font-semibold text-fg">
              {data.holidayName ? `Public holiday: ${data.holidayName}` : "Sunday, day off"}
            </span>
            <span className="text-fg-3"> · No attendance is expected.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {FILTERS.map((f) => (
          <StatCard
            key={f.key}
            label={f.label}
            value={count(f.statuses)}
            tone={f.tone}
            loading={busy}
            onClick={() => setFilter(f.key)}
            active={filter === f.key}
          />
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">
            {FILTERS.find((f) => f.key === filter)!.label}
            <span className="ml-2 font-normal text-fg-3">{rows.length}</span>
          </h2>
        </div>
        <div className="max-h-[62vh] overflow-auto">
          {busy ? (
            <div className="h-64 skeleton rounded-none" />
          ) : rows.length === 0 ? (
            <EmptyState icon={<Users size={32} />} title="No one matches">
              Try another filter or clear the search.
            </EmptyState>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>In</th>
                  <th>Out</th>
                  <th className="num">Worked</th>
                  <th>Details</th>
                  <th className="no-print" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ employee: emp, day }) => (
                  <tr key={emp.id}>
                    <td>
                      <Link to={paths.userAttendance(emp.id, month)} className="group flex items-center gap-3">
                        <Avatar name={emp.userName} src={emp.imageUrl} />
                        <span>
                          <span className="block font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                            {emp.userName}
                          </span>
                          <span className="block text-xs text-fg-3">{emp.roles || emp.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <DayStatusChip status={day.status} />
                    </td>
                    <td className="tabular-nums">{fmtTime(day.checkInTime)}</td>
                    <td className="tabular-nums">
                      {day.missedClockOut ? <span className="text-rose-600">Missed</span> : fmtTime(day.checkOutTime)}
                    </td>
                    <td className="num">{day.workedMinutes ? fmtMinutes(day.workedMinutes) : "–"}</td>
                    <td className="max-w-xs whitespace-normal">
                      <DayFlags day={day} />
                      {(day.leaveType || day.remark) && (
                        <div className="text-xs text-fg-3">
                          {[day.leaveType && `${day.leaveType} leave`, day.remark].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="no-print text-right">
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
        <div className="border-t border-slate-100 px-5 py-3 dark:border-zinc-800">
          <StatusLegend />
        </div>
      </div>
    </>
  );
}
