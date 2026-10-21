import { ReactNode } from "react";
import { Calendar, Flag, LogIn, LogOut, Pencil, Plus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { DayAttendanceRecord, Holiday } from "../../types/attendance";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";
import {
  formatFullDateLabel,
  isSunday as isSundayKey,
} from "../../utils/dateTimeFormatter";
import {
  getArrivalNote,
  getDepartureNote,
  percentFromMinutes,
  positionPercent,
  SHIFT_END_MIN,
  SHIFT_START_MIN,
} from "../../utils/attendanceTime";

interface TimeCardProps {
  date: string;
  record?: DayAttendanceRecord;
  holiday?: Holiday;
  onCreate: () => void;
  onEdit: (record: DayAttendanceRecord) => void;
  onViewLeave: (record: DayAttendanceRecord) => void;
}

// One day's attendance: check-in/out times on a timeline, or the reason
// there's nothing to show (holiday, Sunday, absent, on leave, no record).
export default function TimeCard({
  date,
  record,
  holiday,
  onCreate,
  onEdit,
  onViewLeave,
}: TimeCardProps) {
  const { hasPermission } = useAuth();
  const isSunday = isSundayKey(date);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-[13px] text-slate-400 dark:text-zinc-500">
            Time card
          </p>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
            {formatFullDateLabel(date)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {holiday ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-2.5 py-1 rounded-full shrink-0">
              <Flag size={11} />
              Public holiday
            </span>
          ) : isSunday && !record ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 rounded-full shrink-0">
              <Calendar size={11} />
              Day off
            </span>
          ) : (
            record && (
              <>
                <StatusBadge status={record.status} />
                {record.status !== "Leave" &&
                  hasPermission(Permission.UpdateAttendance) && (
                  <button
                    onClick={() => onEdit(record)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/80 rounded-lg transition-colors cursor-pointer"
                    title="Edit Attendance"
                  >
                    <Pencil size={12} />
                    <span>Edit</span>
                  </button>
                )}
              </>
            )
          )}
        </div>
      </div>

      {holiday ? (
        <EmptyState
          title={
            <span className="text-[16px] text-red-500 dark:text-red-400">
              {holiday.name}
            </span>
          }
          note="Public holiday - no work expected on this day."
        />
      ) : !record ? (
        isSunday ? (
          <EmptyState
            title="Sunday - Day Off"
            note="No attendance tracking expected on Sundays."
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-3">
            <p className="text-sm text-slate-400 dark:text-zinc-500">
              No attendance record for this day.
            </p>
            {hasPermission(Permission.CreateAttendance) && (
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Record</span>
              </button>
            )}
          </div>
        )
      ) : record.status === "Absent" ? (
        <EmptyState title="Marked absent for this day." note={record.remark} />
      ) : record.status === "Leave" ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-2">
          <p className="text-sm text-slate-600 dark:text-zinc-300">
            On approved leave this day.
          </p>
          {record.remark && (
            <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
              {record.remark}
            </p>
          )}
          {hasPermission(Permission.ViewLeave) && (
            <button
              onClick={() => onViewLeave(record)}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/80 rounded-xl transition-colors cursor-pointer"
            >
              View Leave Detail
            </button>
          )}
        </div>
      ) : (
        <PunchTimeline record={record} />
      )}
    </div>
  );
}

function EmptyState({ title, note }: { title: ReactNode; note?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-1.5">
      <p className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
        {title}
      </p>
      {note && (
        <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
          {note}
        </p>
      )}
    </div>
  );
}

function PunchTimeline({ record }: { record: DayAttendanceRecord }) {
  const { checkInTime, checkOutTime } = record;

  return (
    <div className="flex-1 flex flex-col justify-center">
      {/* Punch-clock readout */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-3xl font-bold font-mono tabular-nums text-slate-800 dark:text-zinc-100">
            {checkInTime || "--:--"}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            Check in
          </p>
        </div>

        <div className="text-center px-3">
          <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {record.totalHour ?? "--"}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            worked
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold font-mono tabular-nums text-slate-800 dark:text-zinc-100">
            {checkOutTime || "--:--"}
          </p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
            Check out
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 mt-8 mx-2">
        <div
          className="absolute top-0 h-full rounded-full bg-slate-200/80 dark:bg-zinc-700/60"
          style={{
            left: `${percentFromMinutes(SHIFT_START_MIN)}%`,
            width: `${percentFromMinutes(SHIFT_END_MIN) - percentFromMinutes(SHIFT_START_MIN)}%`,
          }}
          title="Scheduled shift"
        />

        {checkInTime && checkOutTime && (
          <div
            className="absolute top-0 h-full rounded-full bg-indigo-500 motion-safe:transition-all motion-safe:duration-300"
            style={{
              left: `${positionPercent(checkInTime)}%`,
              width: `${Math.max(positionPercent(checkOutTime) - positionPercent(checkInTime), 0)}%`,
            }}
          />
        )}

        {checkInTime && (
          <TimelineMarker time={checkInTime} className="bg-emerald-500">
            <LogIn size={10} className="text-white" />
          </TimelineMarker>
        )}

        {checkOutTime && (
          <TimelineMarker time={checkOutTime} className="bg-rose-500">
            <LogOut size={10} className="text-white" />
          </TimelineMarker>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 px-1 text-xs text-slate-500 dark:text-zinc-400">
        <span>{checkInTime && getArrivalNote(checkInTime)}</span>
        <span>{checkOutTime && getDepartureNote(checkOutTime)}</span>
      </div>

      {record.remark && (
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-4 px-1 border-t border-slate-100 dark:border-zinc-800 pt-3">
          {record.remark}
        </p>
      )}
    </div>
  );
}

function TimelineMarker({
  time,
  className,
  children,
}: {
  time: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute -top-2 motion-safe:transition-all motion-safe:duration-300"
      style={{ left: `calc(${positionPercent(time)}% - 11px)` }}
    >
      <div
        className={`w-[22px] h-[22px] rounded-full border-4 border-white dark:border-zinc-900 shadow-md flex items-center justify-center ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
