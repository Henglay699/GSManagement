import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CalendarDays, CircleDot, Clock, Mail, Pencil, Plus, StickyNote, Timer, X } from "lucide-react";
import { LEAVE_TYPES } from "../../types/leave";
import type { DayStatus, MonthSummary, SummaryDay } from "../../types/attendance";
import { fmtMinutes, fmtNumber, initials, monthLabel } from "../../lib/attendanceDisplay";
import { todayKey } from "../../utils/dateTimeFormatter";
import MonthPicker from "../ui/MonthPicker";
import ZoomablePhoto from "../ui/ZoomablePhoto";
import AttendanceRing from "./AttendanceRing";
import ClockRange from "./ClockRange";
import DayNote from "./DayNote";
import { StatusBadge } from "./StatusBadge";

interface MonthViewProps {
  year: number;
  month: number;
  summary: MonthSummary | undefined;
  loading?: boolean;
  onChangeMonth: (year: number, month: number) => void;
  // Shows a back button before the name (HR's view of an employee).
  onBack?: () => void;
  // Buttons on the right of the header, e.g. Print and Export.
  actions?: ReactNode;
  // HR only: lets a day be corrected (or a record added for it).
  onEditDay?: (day: SummaryDay) => void;
}

const NOT_EDITABLE: DayStatus[] = ["OnLeave", "Holiday", "DayOff", "Upcoming"];

// Figures that can filter the day list.
const DAY_FILTERS: Record<string, { label: string; test: (d: SummaryDay) => boolean }> = {
  all: { label: "Daily record", test: () => true },
  present: { label: "Days present", test: (d) => !!d.checkInTime },
  late: { label: "Late days", test: (d) => d.lateMinutes > 0 },
  absent: { label: "Absent days", test: (d) => d.status === "Absent" || d.status === "NoRecord" },
  leave: { label: "Leave days", test: (d) => d.status === "OnLeave" || d.status === "HalfDay" },
  early: { label: "Left early", test: (d) => d.earlyLeaveMinutes > 0 },
  noout: { label: "Missed clock-outs", test: (d) => d.missedClockOut },
  overtime: { label: "Overtime days", test: (d) => d.overtimeMinutes > 0 },
};

const TH = "border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-fg-2 dark:border-line dark:bg-subtle";
const TD = "border-b border-slate-100 px-4 py-2.5 align-middle dark:border-line";

/**
 * One employee's month, laid out like the printed record: a strip of figures
 * (most of them filter the list) and a row per day, newest first.
 * The employee sees it on "My attendance"; HR sees the same thing per employee.
 */
export default function MonthView({
  year,
  month,
  summary,
  loading = false,
  onChangeMonth,
  onBack,
  actions,
  onEditDay,
}: MonthViewProps) {
  const [filter, setFilter] = useState("all");
  const days = useMemo(() => summary?.days ?? [], [summary]);
  const e = summary?.employee;
  const t = summary?.totals;
  const busy = loading && !summary;
  const today = todayKey();

  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  // Newest first, so the 1st of the month is at the bottom; days still to come are left out.
  const rows = useMemo(() => {
    const test = DAY_FILTERS[filter]!.test;
    return days.filter((d) => d.status !== "Upcoming" && test(d)).reverse();
  }, [days, filter]);
  const pick = (key: string) => setFilter((f) => (f === key ? "all" : key));

  const leaveTaken = t
    ? LEAVE_TYPES.filter((lt) => t.leaveByType[lt])
        .map((lt) => `${lt} ${fmtNumber(t.leaveByType[lt])}`)
        .join(", ")
    : "";

  const figures: { label: string; value: ReactNode; filter?: string; tone?: string }[] = [
    { label: "Attendance", value: t ? `${fmtNumber(t.attendanceRate)}%` : "–" },
    { label: "Punctuality", value: t ? `${fmtNumber(t.punctualityRate)}%` : "–" },
    { label: "Present", value: t ? `${fmtNumber(t.presentDays)} / ${t.workingDays}` : "–", filter: "present" },
    {
      label: "Late",
      value: t ? (t.lateDays ? `${t.lateDays}d · ${fmtMinutes(t.lateMinutes)}` : "0") : "–",
      filter: "late",
      tone: t?.lateDays ? "text-orange-600 dark:text-orange-400" : undefined,
    },
    {
      label: "Absent",
      value: t ? `${fmtNumber(t.absentDays)}d` : "–",
      filter: "absent",
      tone: t?.absentDays ? "text-rose-600 dark:text-rose-400" : undefined,
    },
    { label: "Leave", value: t ? `${fmtNumber(t.leaveDays)}d` : "–", filter: "leave" },
    { label: "Left early", value: t ? `${t.earlyLeaveDays}d` : "–", filter: "early" },
    {
      label: "Missed clock-outs",
      value: t?.missedClockOuts ?? "–",
      filter: "noout",
      tone: t?.missedClockOuts ? "text-rose-600 dark:text-rose-400" : undefined,
    },
    { label: "Hours worked", value: t ? `${fmtNumber(t.workedHours)}h` : "–" },
    { label: "Overtime", value: t ? `${fmtNumber(t.overtimeHours)}h` : "–", filter: "overtime" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {e?.imageUrl ? (
              <ZoomablePhoto src={e.imageUrl} alt={e.userName} className="h-full w-full object-cover" />
            ) : e ? (
              initials(e.userName)
            ) : null}
          </div>

          <div className="min-w-0">
            {e ? (
              <>
                <h1 className="truncate text-base font-bold text-slate-800 dark:text-zinc-100">{e.userName}</h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                  <Mail size={11} className="shrink-0" />
                  <span className="truncate">{e.email}</span>
                  {e.roles && (
                    <>
                      <span className="text-slate-300 dark:text-zinc-600">/</span>
                      <span className="truncate">{e.roles}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="skeleton block h-4 w-36" />
                <span className="skeleton mt-1.5 block h-3 w-48" />
              </>
            )}
          </div>

          <div className="ml-1 hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex dark:border-zinc-800">
            <AttendanceRing percent={t ? t.attendanceRate : null} />
            <span className="max-w-[6.5rem] text-xs leading-tight text-slate-500 dark:text-zinc-400">
              attendance {isCurrent ? "this month" : "in " + monthLabel(year, month).split(" ")[0]}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker year={year} month={month} onChange={onChangeMonth} />
          {actions}
        </div>
      </div>

      {/* Figures: one strip, like the printed record. Most of them filter the list. */}
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-xs sm:grid-cols-5 xl:grid-cols-10 dark:border-line">
        {figures.map((f) => {
          const active = filter === f.filter;
          const body = (
            <>
              <span className="block truncate text-[11px] text-fg-2">{f.label}</span>
              {busy ? (
                <span className="skeleton mt-1 block h-5 w-10" />
              ) : (
                <span className={`mt-0.5 block truncate text-base font-semibold tabular-nums ${f.tone ?? "text-fg"}`}>
                  {f.value}
                </span>
              )}
            </>
          );
          const cls = "min-w-0 border-b border-r border-slate-100 px-3.5 py-2.5 text-left dark:border-line";
          return f.filter ? (
            <button
              key={f.label}
              type="button"
              onClick={() => pick(f.filter!)}
              aria-pressed={active}
              title={`Show ${DAY_FILTERS[f.filter]!.label.toLowerCase()}`}
              className={`${cls} transition-colors ${
                active
                  ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-950/40 dark:ring-indigo-800"
                  : "hover:bg-slate-50 dark:hover:bg-zinc-800/60"
              }`}
            >
              {body}
            </button>
          ) : (
            <div key={f.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      {/* Daily record: scrolls inside its box so the page fits on one screen. */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-xs dark:border-line">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-line">
          <h2 className="text-sm font-semibold text-fg">{DAY_FILTERS[filter]!.label}</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-fg-2 dark:bg-subtle">
            {rows.length}
          </span>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <X size={12} /> Show all days
            </button>
          )}
          {leaveTaken && <span className="ml-auto text-[11px] text-fg-3">Leave taken: {leaveTaken}</span>}
        </div>

        <div className="max-h-[calc(100vh-20rem)] min-h-[240px] overflow-auto">
          {busy ? (
            <div className="h-64 skeleton rounded-none" />
          ) : rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-xs text-fg-3">No days match this filter.</p>
          ) : (
            <table className="w-full min-w-[820px] border-separate border-spacing-0 text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={`${TH} w-[18%]`}>
                    <span className="flex items-center gap-1.5"><CalendarDays size={13} /> Date</span>
                  </th>
                  <th className={`${TH} w-[32%] border-l`}>
                    <span className="flex items-center gap-1.5"><Clock size={13} /> Clock-in & Out</span>
                  </th>
                  <th className={`${TH} border-l`}>
                    <span className="flex items-center gap-1.5"><Timer size={13} /> Overtime</span>
                  </th>
                  <th className={`${TH} border-l`}>
                    <span className="flex items-center gap-1.5"><CircleDot size={13} /> Status</span>
                  </th>
                  <th className={`${TH} border-l`}>
                    <span className="flex items-center gap-1.5"><StickyNote size={13} /> Note</span>
                  </th>
                  {onEditDay && <th className={`${TH} no-print w-px`} />}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const quiet = d.status === "DayOff" || d.status === "Holiday";
                  const editable = onEditDay && !NOT_EDITABLE.includes(d.status);
                  return (
                    <tr
                      key={d.date}
                      className={quiet ? "bg-slate-50/60 dark:bg-zinc-900/40" : "hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"}
                    >
                      <td className={TD}>
                        <span className={`block font-medium ${quiet ? "text-fg-3" : "text-fg"}`}>
                          {new Date(`${d.date}T00:00:00`).toLocaleDateString("en-GB", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {d.date === today ? (
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Today</span>
                        ) : (
                          d.shiftName && <span className="text-[11px] text-fg-3">{d.shiftName}</span>
                        )}
                      </td>
                      <td className={`${TD} border-l`}>
                        <ClockRange day={d} />
                      </td>
                      <td className={`${TD} border-l tabular-nums`}>
                        {d.overtimeMinutes > 0 ? (
                          <span className="font-medium text-fg">{fmtMinutes(d.overtimeMinutes)}</span>
                        ) : (
                          <span className="text-fg-3">-</span>
                        )}
                      </td>
                      <td className={`${TD} border-l`}>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className={`${TD} max-w-[16rem] border-l`}>
                        <DayNote day={d} />
                      </td>
                      {onEditDay && (
                        <td className={`${TD} no-print text-right`}>
                          {editable && (
                            <button onClick={() => onEditDay(d)} className="btn btn-ghost btn-sm">
                              {d.attendanceId ? <Pencil size={14} /> : <Plus size={14} />}
                              {d.attendanceId ? "Edit" : "Add"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
