import { StatusBadge } from "./StatusBadge";
import type { DayAttendanceRecord } from "../../types/attendance";
import { formatShortDateLabel } from "../../utils/dateTimeFormatter";

interface FlaggedDaysListProps {
  records: DayAttendanceRecord[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

// Late or absent days this month, each clickable to jump the time card to it.
export default function FlaggedDaysList({
  records,
  selectedDate,
  onSelect,
}: FlaggedDaysListProps) {
  const flagged = records
    .filter((r) => r.status === "Late" || r.status === "Absent")
    .sort((a, b) => a.date.localeCompare(b.date));

  if (flagged.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-zinc-500 py-1">
        No late or absent days this month.
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
      {flagged.map((r) => {
        const isSelected = r.date === selectedDate;
        return (
          <button
            key={r.date}
            onClick={() => onSelect(r.date)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              isSelected
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
            }`}
          >
            <span className="font-medium">{formatShortDateLabel(r.date)}</span>
            <StatusBadge status={r.status} />
          </button>
        );
      })}
    </div>
  );
}
