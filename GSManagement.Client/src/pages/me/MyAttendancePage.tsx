import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  Coffee,
  Calendar,
  Flame,
  TrendingUp,
  Activity,
  ShieldCheck,
  CalendarCheck,
  Check,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import {
  clockIn,
  clockOut,
  fetchMyMonthlySummary,
  fetchTodayStatus,
} from "../../services/employeeAttendanceService";
import { StatusBadge } from "../../components/attendance/StatusBadge";
import type {
  EmployeeMonthlySummary,
  EmployeeTodayStatus,
} from "../../types/attendance";

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clocking, setClocking] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);


  // Live timer for clock display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today status
  const {
    data: todayStatus,
    loading: loadingStatus,
    reload: reloadStatus,
  } = useAsync<EmployeeTodayStatus>(
    useCallback(() => fetchTodayStatus(), []),
    "Failed to load today's attendance status",
  );

  // Fetch monthly summary
  const {
    data: monthlySummary,
    reload: reloadSummary,
  } = useAsync<EmployeeMonthlySummary>(
    useCallback(
      () =>
        fetchMyMonthlySummary(
          currentTime.getFullYear(),
          currentTime.getMonth() + 1,
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    ),
    "Failed to load monthly attendance",
  );

  async function handleClockIn() {
    setClocking(true);
    setActionMessage(null);
    try {
      const res = await clockIn();
      setActionMessage({ type: "success", text: res.message });
      reloadStatus();
      reloadSummary();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: getErrorMessage(err, "Clock-in failed. Please try again."),
      });
    } finally {
      setClocking(false);
    }
  }

  async function handleClockOut() {
    setClocking(true);
    setActionMessage(null);
    try {
      const res = await clockOut();
      setActionMessage({ type: "success", text: res.message });
      reloadStatus();
      reloadSummary();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: getErrorMessage(err, "Clock-out failed. Please try again."),
      });
    } finally {
      setClocking(false);
    }
  }

  // Greeting based on time
  const hour = currentTime.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Calculate live working duration if clocked in and not clocked out
  let elapsedMinutes = 0;
  if (todayStatus?.isClockedIn && !todayStatus.isClockedOut && todayStatus.checkInTime) {
    const [h, m] = todayStatus.checkInTime.split(":").map(Number);
    const startMins = h * 60 + m;
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    elapsedMinutes = Math.max(0, currentMins - startMins);
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;

  // On-time percentage calculation
  const totalWorked = monthlySummary?.totalDaysWorked || 0;
  const onTimeCount = monthlySummary?.totalOnTime || 0;
  const onTimePercentage =
    totalWorked > 0 ? Math.round((onTimeCount / totalWorked) * 100) : 100;

  // Shift times come back as "HH:mm:ss"; fall back to the standard 8-to-5.
  const shiftStart = todayStatus?.shift?.startTime?.slice(0, 5) ?? "08:00";
  const shiftEnd = todayStatus?.shift?.endTime?.slice(0, 5) ?? "17:00";
  const graceMinutes = todayStatus?.shift?.graceMinutes ?? 15;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Header Greeting & Digital Clock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
            <Activity size={13} className="text-emerald-400 animate-pulse" />
            <span>Workspace Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {greeting}, {user?.userName || "Colleague"}!
          </h1>
          <p className="text-xs md:text-sm text-indigo-200/80">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Live Digital Clock Display */}
        <div className="relative z-10 flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/10 px-5 py-3 rounded-2xl self-start md:self-auto">
          <Clock size={24} className="text-indigo-400" />
          <div>
            <div className="text-2xl font-mono font-bold tracking-wider tabular-nums">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </div>
            <div className="text-[10px] text-indigo-300 font-medium tracking-wide uppercase">
              Standard Time (GMT+7)
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold border transition-all animate-in fade-in slide-in-from-top-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Primary Hero Grid: Punch Clock & Today's Shift */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Punch Clock Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Attendance Punch
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                Daily Clock In & Out
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                Record your daily work attendance according to the scheduled shift.
              </p>
            </div>

            {/* Shift pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold shrink-0">
              <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{todayStatus?.shift?.name || "Regular Shift"} (8:00 AM – 5:00 PM)</span>
            </div>
          </div>

          {/* Punch Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
            {/* Clock-In State */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
                <LogIn size={14} className="text-emerald-500" />
                <span>Clock In Time</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100">
                {todayStatus?.checkInTime ? todayStatus.checkInTime.slice(0, 5) : "--:--"}
              </div>
              <p className="text-[11px] text-slate-400">
                {todayStatus?.isClockedIn ? "Logged on time" : "Not yet checked in"}
              </p>
            </div>

            {/* Clock-Out State */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
                <LogOut size={14} className="text-rose-500" />
                <span>Clock Out Time</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100">
                {todayStatus?.checkOutTime ? todayStatus.checkOutTime.slice(0, 5) : "--:--"}
              </div>
              <p className="text-[11px] text-slate-400">
                {todayStatus?.isClockedOut ? "Workday completed" : "Pending checkout"}
              </p>
            </div>

            {/* Overtime & Duration State */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
                <Flame size={14} className="text-amber-500" />
                <span>Overtime Tracked</span>
              </div>
              <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {todayStatus?.overtimeMinutes && todayStatus.overtimeMinutes > 0
                  ? `+${(todayStatus.overtimeMinutes / 60).toFixed(1)} hrs`
                  : "0.0 hrs"}
              </div>
              <p className="text-[11px] text-slate-400">
                {todayStatus?.overtimeMinutes && todayStatus.overtimeMinutes > 0
                  ? `${todayStatus.overtimeMinutes} mins past shift end`
                  : "Within normal shift"}
              </p>
            </div>
          </div>

          {/* Half-Day Notice if applicable */}
          {todayStatus?.isHalfDay && (
            <div className="mt-3 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
                {todayStatus.halfDayPeriod === "Morning" ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <div className="text-xs">
                <div className="font-bold text-indigo-900 dark:text-indigo-200">
                  Approved Half-Day Leave ({todayStatus.halfDayPeriod || "Active"})
                </div>
                <div className="text-indigo-700/80 dark:text-indigo-300">
                  {todayStatus.halfDayPeriod === "Morning"
                    ? "Morning leave approved (8:00 AM – 12:00 PM). Expected work hours: 1:00 PM – 5:00 PM."
                    : "Afternoon leave approved (1:00 PM – 5:00 PM). Expected work hours: 8:00 AM – 12:00 PM."}
                </div>
              </div>
            </div>
          )}

          {/* Live Action Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Today's Status:</span>
              {todayStatus?.status ? (
                <StatusBadge status={todayStatus.status} />
              ) : (
                <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
                  Ready to punch
                </span>
              )}
              {todayStatus?.isClockedIn && !todayStatus.isClockedOut && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Working ({elapsedHours}h {elapsedMins}m)
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!todayStatus?.isClockedIn ? (
                <button
                  onClick={handleClockIn}
                  disabled={clocking || loadingStatus}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {clocking ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogIn size={16} />
                  )}
                  <span>Clock In Now</span>
                </button>
              ) : !todayStatus?.isClockedOut ? (
                <button
                  onClick={handleClockOut}
                  disabled={clocking || loadingStatus}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {clocking ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                  <span>Clock Out</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-semibold">
                  <Check size={14} className="text-emerald-500" />
                  <span>Clocked Out for Today</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule & Shift Info Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Shift Schedule
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm">
                  {todayStatus?.shift?.name || "Regular Shift"}
                </span>
                {todayStatus?.shift?.isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    Default
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-zinc-400">Start Time:</span>
                  <span className="font-semibold">{shiftStart}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-zinc-400">End Time:</span>
                  <span className="font-semibold">{shiftEnd}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-zinc-400">Grace Period:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {graceMinutes} mins
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-zinc-400">Overtime Threshold:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    After {shiftEnd}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Quick Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={paths.myLeaves}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-zinc-700/60 transition-all text-xs font-semibold text-slate-700 dark:text-zinc-200 flex flex-col gap-1"
              >
                <Coffee size={16} className="text-purple-500" />
                <span>Request Leave</span>
              </Link>
              <Link
                to={paths.myAttendanceHistory}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-zinc-700/60 transition-all text-xs font-semibold text-slate-700 dark:text-zinc-200 flex flex-col gap-1"
              >
                <CalendarCheck size={16} className="text-indigo-500" />
                <span>My History</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly Attendance KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
            Monthly Performance Summary ({currentTime.toLocaleString("default", { month: "long" })})
          </h3>
          <span className="text-xs text-slate-400">
            {monthlySummary?.totalDaysWorked ?? 0} active workdays recorded
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Days */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Days Present</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
              {monthlySummary?.totalDaysWorked ?? 0}
            </div>
            <p className="text-[10px] text-slate-400">Days clocked in</p>
          </div>

          {/* Total Hours Worked */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              <Clock size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Hours Worked</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
              {monthlySummary?.totalHoursWorked ?? 0}h
            </div>
            <p className="text-[10px] text-slate-400">Regular & overtime</p>
          </div>

          {/* Total Overtime */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              <Flame size={14} className="text-amber-500" />
              <span>Total Overtime</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              +{monthlySummary?.totalOvertimeHours ?? 0}h
            </div>
            <p className="text-[10px] text-slate-400">Accumulated this month</p>
          </div>

          {/* On-Time Rate */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              <TrendingUp size={14} className="text-blue-500" />
              <span>On-Time Rate</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
              {onTimePercentage}%
            </div>
            <p className="text-[10px] text-slate-400">
              {monthlySummary?.totalOnTime ?? 0} on time, {monthlySummary?.totalLate ?? 0} late
            </p>
          </div>

          {/* Leaves & Half Days */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-semibold">
              <Coffee size={14} className="text-purple-500" />
              <span>Leaves & Half-Day</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100">
              {(monthlySummary?.totalLeave ?? 0) + (monthlySummary?.totalHalfDayLeave ?? 0)}
            </div>
            <p className="text-[10px] text-slate-400">
              {monthlySummary?.totalHalfDayLeave ?? 0} half-day, {monthlySummary?.totalLeave ?? 0} full-day
            </p>
          </div>
        </div>
      </div>


      {/* 5. Recent Monthly Log Entries */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span>My Recent Attendance Activity</span>
          </h3>
          <span className="text-xs text-slate-400">
            {monthlySummary?.records?.length ?? 0} days recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Shift</th>
                <th className="py-2.5 px-3">Check In</th>
                <th className="py-2.5 px-3">Check Out</th>
                <th className="py-2.5 px-3">Hours</th>
                <th className="py-2.5 px-3">Overtime</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {(!monthlySummary?.records || monthlySummary.records.length === 0) ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                    No attendance records for this month yet. Use the Clock In button above!
                  </td>
                </tr>
              ) : (
                monthlySummary.records
                  .slice()
                  .reverse()
                  .slice(0, 7)
                  .map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-zinc-200">
                        {rec.date}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-zinc-400">
                        {rec.shiftName || "Regular Shift"}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium">
                        {rec.checkInTime ? rec.checkInTime.slice(0, 5) : "--:--"}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium">
                        {rec.checkOutTime ? rec.checkOutTime.slice(0, 5) : "--:--"}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {rec.totalHours ? `${rec.totalHours.toFixed(1)} hrs` : "--"}
                      </td>
                      <td className="py-3 px-3">
                        {rec.overtimeMinutes && rec.overtimeMinutes > 0 ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            +{(rec.overtimeMinutes / 60).toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-slate-400">0h</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={rec.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-xs">
                        {rec.remark || "--"}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
