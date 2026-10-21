import type { MonthlyAttendanceSummary } from "../../types/attendance";

// Stacked bar + legend breaking the month down by attendance status.
export default function CompositionBar({
  summary,
}: {
  summary: MonthlyAttendanceSummary;
}) {
  const segments = [
    { key: "present", label: "On time", value: summary.present, color: "bg-emerald-500" },
    { key: "late", label: "Late", value: summary.late, color: "bg-amber-500" },
    { key: "absent", label: "Absent", value: summary.absent, color: "bg-rose-500" },
    { key: "leave", label: "Leave", value: summary.leave, color: "bg-purple-500" },
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
                  title={`${s.label}: ${s.value}`}
                />
              ),
          )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {segments.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400"
          >
            <span className={`w-2 h-2 rounded-sm shrink-0 ${s.color}`} />
            <span className="font-semibold text-slate-800 dark:text-zinc-100">
              {s.value}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
