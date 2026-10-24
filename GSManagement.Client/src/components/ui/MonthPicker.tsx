import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { monthLabel } from "../../lib/attendanceDisplay";

interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

// Month switcher pill used by every monthly view. Stops at the current month;
// "This month" jumps back when looking at an older one.
export default function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(d.getFullYear(), d.getMonth() + 1);
  };

  return (
    <div className="flex items-center gap-2">
      {!isCurrent && (
        <button
          onClick={() => onChange(now.getFullYear(), now.getMonth() + 1)}
          className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          This month
        </button>
      )}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <button
          onClick={() => shift(-1)}
          className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Previous month"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="w-28 text-center text-xs font-semibold text-slate-700 dark:text-zinc-200">
          {monthLabel(year, month)}
        </span>
        <button
          onClick={() => shift(1)}
          disabled={isCurrent}
          className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Next month"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
