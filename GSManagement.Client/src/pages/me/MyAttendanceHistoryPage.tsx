import { useCallback, useState } from "react";
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import { fetchMyMonthlySummary } from "../../services/employeeAttendanceService";
import { StatusBadge } from "../../components/attendance/StatusBadge";
import { HalfDayBadge } from "../../components/leave/LeaveStatusBadge";

// The logged-in employee's attendance for one month at a time.
export default function MyAttendanceHistoryPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data, loading, error } = useAsync(
    useCallback(() => fetchMyMonthlySummary(year, month), [year, month]),
    "Failed to load your attendance.",
  );

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const cards = [
    { label: "Days Worked", value: data?.totalDaysWorked ?? 0, tone: "text-slate-900 dark:text-zinc-100" },
    { label: "Hours Worked", value: `${(data?.totalHoursWorked ?? 0).toFixed(1)}h`, tone: "text-slate-900 dark:text-zinc-100" },
    { label: "Overtime", value: `${(data?.totalOvertimeHours ?? 0).toFixed(1)}h`, tone: "text-amber-600 dark:text-amber-400" },
    { label: "On Time", value: data?.totalOnTime ?? 0, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Late", value: data?.totalLate ?? 0, tone: "text-amber-600 dark:text-amber-400" },
    {
      label: "Leave",
      value: (data?.totalLeave ?? 0) + (data?.totalHalfDayLeave ?? 0),
      tone: "text-purple-600 dark:text-purple-400",
    },
    { label: "Absent", value: data?.totalAbsent ?? 0, tone: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <CalendarDays size={20} className="text-indigo-600 dark:text-indigo-400" />
            My Attendance History
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Your clock-in records, hours, and overtime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold w-36 text-center text-slate-800 dark:text-zinc-200">
            {monthLabel}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
          >
            <span className="text-xs text-slate-500 dark:text-zinc-400">{c.label}</span>
            <div className={`text-xl font-bold mt-0.5 ${c.tone}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Shift</th>
              <th className="py-3 px-4">Check In</th>
              <th className="py-3 px-4">Check Out</th>
              <th className="py-3 px-4">Hours</th>
              <th className="py-3 px-4">Overtime</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {loading && !data ? (
              <tr>
                <td colSpan={8} className="py-10 text-center">
                  <Loader2 className="w-5 h-5 animate-spin inline text-indigo-500" />
                </td>
              </tr>
            ) : !data?.records.length ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400 dark:text-zinc-500">
                  No attendance records for {monthLabel}.
                </td>
              </tr>
            ) : (
              data.records
                .slice()
                .reverse()
                .map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-zinc-200">
                      {rec.date}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-zinc-400">
                      {rec.shiftName || "--"}
                    </td>
                    <td className="py-3 px-4 font-mono">{rec.checkInTime?.slice(0, 5) ?? "--:--"}</td>
                    <td className="py-3 px-4 font-mono">{rec.checkOutTime?.slice(0, 5) ?? "--:--"}</td>
                    <td className="py-3 px-4 font-semibold">
                      {rec.totalHours ? `${rec.totalHours.toFixed(1)}h` : "--"}
                    </td>
                    <td className="py-3 px-4">
                      {rec.overtimeMinutes && rec.overtimeMinutes > 0 ? (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                          +{(rec.overtimeMinutes / 60).toFixed(1)}h
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={rec.status} />
                        {rec.isHalfDay && <HalfDayBadge period={rec.halfDayPeriod} />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{rec.remark || "--"}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
