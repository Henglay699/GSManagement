import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import type { MonthSummary, SummaryDay, SummaryTotals } from "../../types/attendance";
import { DAY_STATUS, FLAG_TONE, dayFlags, fmtNumber, initials, monthLabel } from "../../lib/attendanceDisplay";
import { todayKey } from "../../utils/dateTimeFormatter";
import MonthPicker from "../ui/MonthPicker";
import ZoomablePhoto from "../ui/ZoomablePhoto";
import AttendanceRing from "./AttendanceRing";
import TimeCard from "./TimeCard";
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

/**
 * One employee's month: who, how much they attended, a time card for the
 * selected day, and a calendar with the month's breakdown and flagged days.
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
  const [picked, setPicked] = useState<string | null>(null);
  const days = useMemo(() => summary?.days ?? [], [summary]);
  const e = summary?.employee;
  const t = summary?.totals;
  const busy = loading && !summary;

  // The picked day if it's in this month, otherwise the last day so far.
  const selected =
    days.find((d) => d.date === picked) ?? days.find((d) => d.date === summary?.periodEnd) ?? days[0] ?? null;

  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-5">
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        {busy || !selected ? (
          <div className="h-80 animate-pulse rounded-2xl bg-subtle" />
        ) : (
          <TimeCard day={selected} onEdit={onEditDay} />
        )}

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {busy ? (
            <div className="h-64 animate-pulse rounded-xl bg-subtle" />
          ) : (
            <Calendar days={days} selected={selected?.date ?? null} onSelect={setPicked} />
          )}

          {t && (
            <div className="border-t border-slate-100 pt-4 dark:border-zinc-800">
              <CompositionBar totals={t} />
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 dark:border-zinc-800">
            <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">Needs attention this month</p>
            <FlaggedDays days={days} selected={selected?.date ?? null} onSelect={setPicked} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- calendar

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

// Bar under the date: the day's status.
const STATUS_BAR: Partial<Record<SummaryDay["status"], string>> = {
  Present: "bg-emerald-500",
  Late: "bg-amber-500",
  HalfDay: "bg-indigo-500",
  OnLeave: "bg-purple-500",
  Absent: "bg-rose-500",
  InProgress: "bg-sky-500",
  NoRecord: "bg-slate-300 dark:bg-zinc-600",
};

function Calendar({
  days,
  selected,
  onSelect,
}: {
  days: SummaryDay[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const today = todayKey();
  if (!days.length) return null;
  const leading = (new Date(`${days[0]!.date}T00:00:00`).getDay() + 6) % 7; // Monday = 0

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {WEEKDAYS.map((d, i) => (
        <span key={`${d}-${i}`} className="py-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
          {d}
        </span>
      ))}
      {Array.from({ length: leading }, (_, i) => (
        <span key={`pad-${i}`} />
      ))}
      {days.map((d) => {
        const isSelected = d.date === selected;
        const isToday = d.date === today;
        const holiday = d.status === "Holiday";
        const quiet = d.status === "DayOff" || d.status === "Upcoming";
        const bar = STATUS_BAR[d.status];
        return (
          <button
            key={d.date}
            onClick={() => onSelect(d.date)}
            title={[DAY_STATUS[d.status].label, d.holidayName].filter(Boolean).join(" · ")}
            className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors ${
              isSelected
                ? "bg-indigo-600 text-white"
                : isToday
                  ? "text-indigo-600 ring-1 ring-inset ring-indigo-400 dark:text-indigo-400 dark:ring-indigo-500"
                  : quiet
                    ? "text-slate-300 hover:bg-slate-100 dark:text-zinc-600 dark:hover:bg-zinc-800"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{Number(d.date.slice(8))}</span>
            {holiday && (
              <span
                className={`absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-rose-500"}`}
              />
            )}
            {bar && (
              <span className={`absolute bottom-1 h-[3px] w-3 rounded-full ${isSelected ? "bg-white/80" : bar}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------- breakdown bar

function CompositionBar({ totals: t }: { totals: SummaryTotals }) {
  const segments = [
    { key: "ontime", label: "On time", value: t.onTimeDays, color: "bg-emerald-500" },
    { key: "late", label: "Late", value: t.lateDays, color: "bg-amber-500" },
    { key: "absent", label: "Absent", value: t.absentDays, color: "bg-rose-500" },
    { key: "leave", label: "Leave", value: t.leaveDays, color: "bg-purple-500" },
  ];
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
        {total > 0 &&
          segments.map(
            (s) =>
              s.value > 0 && (
                <div
                  key={s.key}
                  className={`${s.color} h-full motion-safe:transition-all motion-safe:duration-500`}
                  style={{ width: `${(s.value / total) * 100}%` }}
                  title={`${s.label}: ${fmtNumber(s.value)}`}
                />
              ),
          )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <span className={`h-2 w-2 shrink-0 rounded-sm ${s.color}`} />
            <span className="font-semibold text-slate-800 dark:text-zinc-100">{fmtNumber(s.value)}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
        <span className="font-semibold text-slate-800 dark:text-zinc-100">{fmtNumber(t.workedHours)}h</span> worked
        {t.overtimeHours > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-slate-800 dark:text-zinc-100">{fmtNumber(t.overtimeHours)}h</span>{" "}
            overtime
          </>
        )}
        {" · "}
        {t.presentDays} of {t.workingDays} working days
      </p>
    </div>
  );
}

// ------------------------------------------------------------ flagged days

const shortLabel = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

// Absent, late, left early or missed clock-out; each one jumps the time card to it.
function FlaggedDays({
  days,
  selected,
  onSelect,
}: {
  days: SummaryDay[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const flagged = days.filter(
    (d) => d.status === "Absent" || d.status === "Late" || d.earlyLeaveMinutes > 0 || d.missedClockOut,
  );

  if (flagged.length === 0) {
    return <p className="py-1 text-xs text-slate-400 dark:text-zinc-500">No late, absent or early days this month.</p>;
  }

  return (
    <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
      {flagged.map((d) => {
        const isSelected = d.date === selected;
        const flag = dayFlags(d).find((f) => f.tone !== "info");
        return (
          <button
            key={d.date}
            onClick={() => onSelect(d.date)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              isSelected
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "text-slate-600 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <span className="font-medium">{shortLabel(d.date)}</span>
            {d.status === "Absent" || d.status === "Late" ? (
              <StatusBadge status={d.status} />
            ) : (
              <span className={`font-semibold ${flag ? FLAG_TONE[flag.tone] : ""}`}>{flag?.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
