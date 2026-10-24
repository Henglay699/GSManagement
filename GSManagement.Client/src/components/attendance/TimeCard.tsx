import type { ReactNode } from "react";
import { Calendar, Flag, LogIn, LogOut, Pencil, Plus } from "lucide-react";
import { fmtMinutes, fmtTime } from "../../lib/attendanceDisplay";
import type { SummaryDay } from "../../types/attendance";
import { StatusBadge } from "./StatusBadge";

interface TimeCardProps {
  day: SummaryDay;
  // HR only: correct the day, or add a record for it.
  onEdit?: (day: SummaryDay) => void;
}

// The timeline spans 06:00–20:00.
const DAY_START = 6 * 60;
const DAY_END = 20 * 60;
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const pct = (t: string) =>
  ((Math.min(Math.max(toMinutes(t), DAY_START), DAY_END) - DAY_START) / (DAY_END - DAY_START)) * 100;

const fullDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const WORKED: SummaryDay["status"][] = ["Present", "Late", "HalfDay", "InProgress"];
const NOT_EDITABLE: SummaryDay["status"][] = ["OnLeave", "Holiday", "DayOff", "Upcoming"];

// One day's attendance: check-in/out on a timeline against the shift, or the
// reason there's nothing to show (holiday, Sunday, absent, on leave, no record).
export default function TimeCard({ day, onEdit }: TimeCardProps) {
  const canEdit = !!onEdit && !NOT_EDITABLE.includes(day.status);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-slate-400 dark:text-zinc-500">Time card</p>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">{fullDate(day.date)}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {day.status === "Holiday" ? (
            <Pill className="border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-400">
              <Flag size={11} /> Public holiday
            </Pill>
          ) : day.status === "DayOff" ? (
            <Pill className="border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Calendar size={11} /> Day off
            </Pill>
          ) : (
            <StatusBadge status={day.status} />
          )}
          {canEdit && day.attendanceId && (
            <button
              onClick={() => onEdit!(day)}
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>
      </div>

      {day.status === "Holiday" ? (
        <Empty
          title={<span className="text-[16px] text-rose-500 dark:text-rose-400">{day.holidayName ?? "Public holiday"}</span>}
          note="Public holiday – no work expected on this day."
        />
      ) : day.status === "DayOff" ? (
        <Empty title="Sunday – Day off" note="No attendance is tracked on Sundays." />
      ) : day.status === "Upcoming" ? (
        <Empty title="This day hasn't come yet." />
      ) : day.status === "OnLeave" ? (
        <Empty
          title="On approved leave this day."
          note={[day.leaveType && `${day.leaveType} leave`, day.remark].filter(Boolean).join(" · ") || undefined}
        />
      ) : day.status === "Absent" ? (
        <Empty title="Marked absent for this day." note={day.remark ?? undefined} />
      ) : WORKED.includes(day.status) ? (
        <PunchTimeline day={day} />
      ) : (
        <Empty
          title={day.status === "NotClockedIn" ? "Not clocked in yet today." : "No attendance record for this day."}
          action={canEdit && <AddButton onClick={() => onEdit!(day)} label="Create record" />}
        />
      )}
    </div>
  );
}

function PunchTimeline({ day }: { day: SummaryDay }) {
  const { checkInTime: inT, checkOutTime: outT, expectedStart: start, expectedEnd: end } = day;
  const live = day.status === "InProgress";

  const arrival = day.lateMinutes > 0 ? `Arrived ${fmtMinutes(day.lateMinutes)} late` : inT ? "Arrived on time" : null;
  const departure = day.missedClockOut
    ? "Missed clock-out"
    : live
      ? "Still clocked in"
      : day.earlyLeaveMinutes > 0
        ? `Left ${fmtMinutes(day.earlyLeaveMinutes)} before shift end`
        : day.overtimeMinutes > 0
          ? `Stayed ${fmtMinutes(day.overtimeMinutes)} overtime`
          : outT
            ? "Left at shift end"
            : null;

  return (
    <div className="flex flex-1 flex-col justify-center">
      {/* Punch-clock readout */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="font-mono text-3xl font-bold tabular-nums text-slate-800 dark:text-zinc-100">
            {inT ? fmtTime(inT) : "--:--"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">Check in</p>
        </div>

        <div className="px-3 text-center">
          <p className="font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {day.workedMinutes ? fmtMinutes(day.workedMinutes) : "--"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">worked</p>
        </div>

        <div className="text-right">
          <p
            className={`font-mono text-3xl font-bold tabular-nums ${
              day.missedClockOut ? "text-rose-500" : "text-slate-800 dark:text-zinc-100"
            }`}
          >
            {outT ? fmtTime(outT) : "--:--"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">Check out</p>
        </div>
      </div>

      {/* Timeline: shift band, worked span, punch markers */}
      <div className="relative mx-2 mt-8 h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800">
        {start && end && (
          <div
            className="absolute top-0 h-full rounded-full bg-slate-200/80 dark:bg-zinc-700/60"
            style={{ left: `${pct(start)}%`, width: `${pct(end) - pct(start)}%` }}
            title={`Shift ${fmtTime(start)} – ${fmtTime(end)}`}
          />
        )}
        {inT && outT && (
          <div
            className="absolute top-0 h-full rounded-full bg-indigo-500 motion-safe:transition-all motion-safe:duration-300"
            style={{ left: `${pct(inT)}%`, width: `${Math.max(pct(outT) - pct(inT), 0)}%` }}
          />
        )}
        {inT && (
          <Marker at={pct(inT)} className="bg-emerald-500">
            <LogIn size={10} className="text-white" />
          </Marker>
        )}
        {outT && (
          <Marker at={pct(outT)} className="bg-rose-500">
            <LogOut size={10} className="text-white" />
          </Marker>
        )}
      </div>
      <div className="mx-2 mt-1.5 flex justify-between text-[10px] tabular-nums text-slate-400 dark:text-zinc-500">
        <span>06:00</span>
        {start && end && (
          <span>
            Shift {fmtTime(start)} – {fmtTime(end)}
            {day.shiftName && ` · ${day.shiftName}`}
          </span>
        )}
        <span>20:00</span>
      </div>

      <div className="mt-4 flex items-center justify-between px-1 text-xs">
        <span className={day.lateMinutes > 0 ? "font-medium text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-zinc-400"}>
          {arrival}
        </span>
        <span
          className={
            day.missedClockOut
              ? "font-medium text-rose-600 dark:text-rose-400"
              : day.earlyLeaveMinutes > 0
                ? "font-medium text-amber-600 dark:text-amber-400"
                : "text-slate-500 dark:text-zinc-400"
          }
        >
          {departure}
        </span>
      </div>

      {(day.halfDayPeriod || day.remark) && (
        <p className="mt-4 border-t border-slate-100 px-1 pt-3 text-xs text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
          {[
            day.halfDayPeriod &&
              `${day.leaveType ?? "Half-day"} leave, ${day.halfDayPeriod.toLowerCase()} off`,
            day.remark,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

function Marker({ at, className, children }: { at: number; className: string; children: ReactNode }) {
  return (
    <div className="absolute -top-2 motion-safe:transition-all motion-safe:duration-300" style={{ left: `calc(${at}% - 11px)` }}>
      <div
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-4 border-white shadow-md dark:border-zinc-900 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

function Empty({ title, note, action }: { title: ReactNode; note?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-10 text-center">
      <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">{title}</p>
      {note && <p className="max-w-xs text-xs text-slate-400 dark:text-zinc-500">{note}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-indigo-500"
    >
      <Plus size={14} /> {label}
    </button>
  );
}
