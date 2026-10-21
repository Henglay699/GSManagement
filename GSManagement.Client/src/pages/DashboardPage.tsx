import { useCallback } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Bell, LayoutDashboard, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks/useAsync";
import { paths } from "../lib/paths";
import { Permission } from "../lib/permissions";
import { fetchAttendanceGrid } from "../services/attendanceService";
import { fetchLeaveRequests } from "../services/leaveService";
import { StatusBadge } from "../components/attendance/StatusBadge";
import { HalfDayBadge } from "../components/leave/LeaveStatusBadge";
import { todayKey } from "../utils/dateTimeFormatter";

// HR/Admin overview of the whole company for today. Routed behind
// ViewAttendance; employees use their own pages under /me instead.
export default function DashboardPage() {
  const { hasPermission } = useAuth();
  const canViewLeave = hasPermission(Permission.ViewLeave);
  const today = todayKey();

  const grid = useAsync(
    useCallback(() => fetchAttendanceGrid(today), [today]),
    "Failed to load today's attendance.",
  );

  const pending = useAsync(
    useCallback(
      () =>
        canViewLeave
          ? fetchLeaveRequests({ status: "Pending", pageNumber: 1, pageSize: 5 })
          : Promise.resolve(null),
      [canViewLeave],
    ),
    "Failed to load pending leave requests.",
  );

  const employees = grid.data?.employees ?? [];
  const rows = employees.map((emp) => ({
    emp,
    rec: emp.attendance.find((a) => a.date === today),
  }));

  const count = (pred: (r: (typeof rows)[number]) => boolean) => rows.filter(pred).length;
  const stats = [
    { label: "Staff", value: rows.length, tone: "text-slate-900 dark:text-zinc-100" },
    { label: "On Time", value: count((r) => r.rec?.status === "OnTime"), tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Late", value: count((r) => r.rec?.status === "Late"), tone: "text-amber-600 dark:text-amber-400" },
    {
      label: "On Leave",
      value: count((r) => r.rec?.status === "Leave" || r.rec?.status === "HalfDayLeave"),
      tone: "text-purple-600 dark:text-purple-400",
    },
    { label: "Absent", value: count((r) => r.rec?.status === "Absent"), tone: "text-rose-600 dark:text-rose-400" },
    { label: "Not Clocked In", value: count((r) => !r.rec), tone: "text-slate-500 dark:text-zinc-400" },
  ];

  const error = grid.error ?? pending.error;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-indigo-600 dark:text-indigo-400" />
          HR Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Company attendance for today, {today}.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
          >
            <span className="text-xs text-slate-500 dark:text-zinc-400">{s.label}</span>
            <div className={`text-2xl font-bold mt-0.5 ${s.tone}`}>
              {grid.loading && !grid.data ? "–" : s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Today's Attendance</h2>
            <Link
              to={paths.attendance}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Full grid <ArrowRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-zinc-400 font-semibold">
                  <th className="py-2.5 px-5">Employee</th>
                  <th className="py-2.5 px-3">Check In</th>
                  <th className="py-2.5 px-3">Check Out</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {grid.loading && !grid.data ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center">
                      <Loader2 className="w-5 h-5 animate-spin inline text-indigo-500" />
                    </td>
                  </tr>
                ) : (
                  rows.map(({ emp, rec }) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-5">
                        <Link
                          to={paths.userAttendance(emp.id, today)}
                          className="font-semibold text-slate-800 dark:text-zinc-200 hover:text-indigo-600"
                        >
                          {emp.name}
                        </Link>
                        <div className="text-[11px] text-slate-400">{emp.role}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{rec?.checkInTime?.slice(0, 5) ?? "--:--"}</td>
                      <td className="py-2.5 px-3 font-mono">{rec?.checkOutTime?.slice(0, 5) ?? "--:--"}</td>
                      <td className="py-2.5 px-3">
                        {rec ? (
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={rec.status} />
                            {rec.isHalfDay && <HalfDayBadge period={rec.halfDayPeriod} />}
                          </div>
                        ) : (
                          <span className="text-slate-400">Not clocked in</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {canViewLeave && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Bell size={15} className="text-purple-500" />
                Pending Leave
                {pending.data && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {pending.data.totalCount}
                  </span>
                )}
              </h2>
              <Link
                to={paths.leaveRequests}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Review <ArrowRight size={13} />
              </Link>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {!pending.data?.items.length ? (
                <li className="px-5 py-8 text-center text-xs text-slate-400">
                  {pending.loading ? "Loading..." : "No pending requests."}
                </li>
              ) : (
                pending.data.items.map((lr) => (
                  <li key={lr.id}>
                    <Link
                      to={paths.leaveDetail(lr.id)}
                      className="block px-5 py-3 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
                    >
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        {lr.userName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        {lr.leaveType} · {lr.startDate}
                        {lr.endDate !== lr.startDate && ` → ${lr.endDate}`}
                        {lr.isHalfDay && <HalfDayBadge period={lr.halfDayPeriod} />}
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
