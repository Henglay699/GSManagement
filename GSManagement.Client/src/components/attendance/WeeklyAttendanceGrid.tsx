import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { paths } from "../../lib/paths";
import { DAY_STATUS, dayFlags, fmtMinutes, fmtTime } from "../../lib/attendanceDisplay";
import { addDays, todayKey } from "../../utils/dateTimeFormatter";
import { fetchWeeklyAttendance } from "../../services/attendanceService";
import type { DayStatus, SummaryDay, SummaryEmployee } from "../../types/attendance";
import Alert from "../ui/Alert";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";
import { DayBadges } from "./StatusBadge";

interface WeeklyAttendanceGridProps {
  // Any date in the week to show. Its column is highlighted.
  date: string;
  onChangeDate: (date: string) => void;
  // Opens the day view for one date.
  onPickDay: (date: string) => void;
  search: string;
  // HR only: correct or add a day. `refreshKey` changes after a save to reload.
  onEdit?: (employee: SummaryEmployee, day: SummaryDay) => void;
  refreshKey?: number;
}

const NOT_EDITABLE: DayStatus[] = ["OnLeave", "Holiday", "DayOff", "Upcoming"];
const PAGE_SIZES = [5, 10, 20, 50];

const weekdayName = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
const shortDay = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const dayNumber = (key: string) => Number(key.slice(8));

/** The weekly grid: every employee, Monday to Sunday, one status per cell. */
export default function WeeklyAttendanceGrid({
  date,
  onChangeDate,
  onPickDay,
  search,
  onEdit,
  refreshKey = 0,
}: WeeklyAttendanceGridProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, loading, error } = useAsync(
    // refreshKey is part of the key so a save reloads the week.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => fetchWeeklyAttendance(date), [date, refreshKey]),
    "Could not load this week's attendance.",
  );

  const today = todayKey();
  const isThisWeek = data ? today >= data.weekStart && today <= data.weekEnd : true;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.rows ?? []).filter(
      (r) => !q || r.employee.userName.toLowerCase().includes(q) || r.employee.roles.toLowerCase().includes(q),
    );
  }, [data, search]);

  // Clamp rather than reset, so a narrower search never lands on an empty page.
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const rangeLabel = data ? `${shortDay(data.weekStart)} – ${shortDay(data.weekEnd)} ${data.weekEnd.slice(0, 4)}` : "";

  return (
    <div className="space-y-3">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            <button
              onClick={() => onChangeDate(addDays(date, -7))}
              className="rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-200/60 dark:text-zinc-300 dark:hover:bg-zinc-700"
              title="Previous week"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-36 whitespace-nowrap px-1.5 text-center text-[11px] font-semibold text-slate-700 dark:text-zinc-200">
              {rangeLabel || "…"}
            </span>
            <button
              onClick={() => onChangeDate(addDays(date, 7))}
              disabled={isThisWeek}
              className="rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-700"
              title="Next week"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          {!isThisWeek && (
            <button
              onClick={() => onChangeDate(today)}
              className="px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              This week
            </button>
          )}
        </div>
        {loading ? (
          <span className="flex items-center gap-1.5 pr-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
            <Loader2 size={13} className="animate-spin" />
            Loading grid...
          </span>
        ) : (
          <span className="pr-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
            {rows.length} employee{rows.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        {loading && !data ? (
          <div className="h-72 skeleton rounded-none" />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="No one matches">
            Clear the search to see everyone.
          </EmptyState>
        ) : (
          <div className="max-h-[68vh] overflow-auto">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                  <th className="sticky left-0 z-10 w-52 border-r border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-800">
                    Employee
                  </th>
                  {data!.days.map((d) => {
                    const selected = d.date === date;
                    return (
                      <th
                        key={d.date}
                        className={`min-w-[125px] border-r border-slate-200 p-0 text-xs font-semibold transition-colors last:border-r-0 dark:border-zinc-800 ${
                          selected
                            ? "border-x-2 border-x-indigo-500 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300"
                            : ""
                        }`}
                      >
                        <button
                          onClick={() => onPickDay(d.date)}
                          title={d.holidayName ?? "Open this day"}
                          className="flex w-full items-center justify-between p-3.5 text-left hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          <span>{weekdayName(d.date)}</span>
                          {selected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 text-xs dark:divide-zinc-800">
                {pageRows.map(({ employee: emp, days }) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="sticky left-0 z-10 border-r border-slate-200 bg-white p-3.5 align-top dark:border-zinc-800 dark:bg-zinc-900">
                      <Link
                        to={paths.userAttendance(emp.id, date.slice(0, 7))}
                        className="group flex items-center gap-3"
                        title={`View ${emp.userName}'s attendance`}
                      >
                        <Avatar name={emp.userName} src={emp.imageUrl} />
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-bold text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
                            {emp.userName}
                          </h4>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-zinc-400">
                            {emp.roles || emp.email}
                          </p>
                        </div>
                      </Link>
                    </td>

                    {days.map((day) => {
                      const selected = day.date === date;
                      return (
                        <td
                          key={day.date}
                          className={`border-r border-slate-200 p-1 align-top transition-colors last:border-r-0 dark:border-zinc-800 ${
                            day.status === "DayOff" ? "bg-slate-50/60 dark:bg-zinc-800/30" : ""
                          } ${selected ? "border-x-2 border-x-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30" : ""}`}
                        >
                          <DayCell
                            day={day}
                            selected={selected}
                            href={paths.userAttendance(emp.id, day.date.slice(0, 7))}
                            onClick={onEdit && !NOT_EDITABLE.includes(day.status) ? () => onEdit(emp, day) : undefined}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] dark:border-zinc-800 dark:bg-zinc-800/70">
            <div className="flex items-center gap-2 font-medium text-slate-500 dark:text-zinc-400">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
                className="cursor-pointer rounded border border-slate-200 bg-white px-1.5 py-0.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="ml-2">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, rows.length)} of{" "}
                {rows.length} employees
              </span>
            </div>

            <div className="flex items-center gap-1">
              <PageButton onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} title="Previous page">
                <ChevronLeft size={14} />
              </PageButton>
              <span className="px-2 font-semibold text-slate-700 dark:text-zinc-300">
                {currentPage} / {totalPages}
              </span>
              <PageButton
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                <ChevronRight size={14} />
              </PageButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded border border-slate-200 bg-white p-1 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      {children}
    </button>
  );
}

// One day in the grid: the date number on top, the status badge below.
// Editable days open the editor; the rest link to the employee's month.
function DayCell({
  day,
  selected,
  href,
  onClick,
}: {
  day: SummaryDay;
  selected: boolean;
  href: string;
  onClick?: () => void;
}) {
  const flags = dayFlags(day);
  const tip = [
    DAY_STATUS[day.status].label,
    day.holidayName,
    day.checkInTime && `${fmtTime(day.checkInTime)} – ${fmtTime(day.checkOutTime)}`,
    day.workedMinutes ? `worked ${fmtMinutes(day.workedMinutes)}` : null,
    ...flags.map((f) => f.label),
    day.leaveType && `${day.leaveType} leave`,
    day.remark,
  ]
    .filter(Boolean)
    .join(" · ");

  const className =
    "group flex h-14 w-full flex-col justify-between rounded-lg p-2 text-left transition-colors hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50";
  const body = (
    <>
      <span
        className={`text-xs ${
          selected
            ? "font-bold text-indigo-700 dark:text-indigo-400"
            : "font-semibold text-slate-700 group-hover:text-indigo-600 dark:text-zinc-300 dark:group-hover:text-indigo-400"
        }`}
      >
        {dayNumber(day.date)}
      </span>
      <DayBadges day={day} />
    </>
  );

  return onClick ? (
    <button onClick={onClick} title={tip} className={`${className} cursor-pointer`}>
      {body}
    </button>
  ) : (
    <Link to={href} title={tip} className={className}>
      {body}
    </Link>
  );
}
