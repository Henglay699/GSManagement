import type {
  AttendanceStatus,
  DayAttendanceRecord,
  Holiday,
} from "../../types/attendance";
import { toDateKey } from "../../utils/dateTimeFormatter";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const STATUS_DOT: Record<AttendanceStatus, string> = {
  OnTime: "bg-emerald-500",
  Late: "bg-amber-500",
  Leave: "bg-purple-500",
  HalfDayLeave: "bg-indigo-500",
  Absent: "bg-rose-500",
};

interface MonthCalendarProps {
  year: number;
  month: number; // zero-based
  selectedDate: string;
  todayKey: string;
  recordsByDate: Map<string, DayAttendanceRecord>;
  holidaysByDate: Map<string, Holiday>;
  onSelect: (dateKey: string) => void;
}

export default function MonthCalendar({
  year,
  month,
  selectedDate,
  todayKey,
  recordsByDate,
  holidaysByDate,
  onSelect,
}: MonthCalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {WEEKDAY_LABELS.map((d, i) => (
        <span
          key={`${d}-${i}`}
          className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 py-1"
        >
          {d}
        </span>
      ))}

      {cells.map((day, idx) => {
        if (day === null) return <span key={`empty-${idx}`} />;

        const dateKey = toDateKey(year, month, day);
        const record = recordsByDate.get(dateKey);
        const holiday = holidaysByDate.get(dateKey);
        const isSelected = dateKey === selectedDate;
        const isToday = dateKey === todayKey;

        return (
          <button
            key={dateKey}
            onClick={() => onSelect(dateKey)}
            title={holiday?.name}
            className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isSelected
                ? "bg-indigo-600 text-white"
                : isToday
                  ? "ring-1 ring-inset ring-indigo-400 dark:ring-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>{day}</span>
            {holiday && (
              <span
                className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                  isSelected ? "bg-white" : "bg-rose-500"
                }`}
              />
            )}
            {record && !holiday && (
              <span
                className={`absolute bottom-1 w-3 h-[3px] rounded-full ${
                  isSelected ? "bg-white/80" : STATUS_DOT[record.status]
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

