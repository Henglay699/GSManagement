import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarX2,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Flame,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  PartyPopper,
  Plane,
  ShieldCheck,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { paths } from "../../lib/paths";
import { fmtMinutes, fmtNumber, fmtTime, shortDate } from "../../lib/attendanceDisplay";
import { clockIn, clockOut, fetchMySummary, fetchToday } from "../../services/employeeAttendanceService";
import type { EmployeeToday } from "../../types/attendance";
import { StatusBadge } from "../../components/attendance/StatusBadge";

const TZ = "Asia/Phnom_Penh";

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Minutes since midnight in Phnom Penh, the same clock the server checks against. */
function phnomPenhMinutes(now: Date) {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(now)
    .split(":")
    .map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

const RECENT: string[] = ["Present", "Late", "HalfDay", "OnLeave", "Absent"];

// The employee's start page: greeting, the clock-in / clock-out punch,
// today's shift, this month's figures and the last few days.
export default function TodayPage() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = useAsync(useCallback(() => fetchToday(), []), "Could not load today's attendance.");
  const month = useAsync(
    useCallback(() => fetchMySummary(new Date().getFullYear(), new Date().getMonth() + 1), []),
    "Could not load this month.",
  );

  async function punch(action: "in" | "out") {
    setBusy(true);
    setMessage(null);
    try {
      const res = action === "in" ? await clockIn() : await clockOut();
      today.setData(res.today);
      setMessage({ tone: "success", text: res.message });
      month.reload();
    } catch (err) {
      setMessage({ tone: "error", text: getErrorMessage(err, "That didn't work. Please try again.") });
    } finally {
      setBusy(false);
    }
  }

  const t = today.data;
  const nowMin = phnomPenhMinutes(now);
  // The server refuses early clock-ins too; this just keeps the button honest.
  const tooEarly = !!t?.canClockIn && nowMin < toMinutes(t.clockInOpensAt);
  const hour = Math.floor(nowMin / 60);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const working = t?.status === "InProgress";
  const elapsed = working && t?.checkInTime ? Math.max(0, nowMin - toMinutes(t.checkInTime)) : 0;
  const clockedOut = !!t?.checkInTime && !!t?.checkOutTime;
  const m = month.data?.totals;
  const recent = (month.data?.days ?? []).filter((d) => RECENT.includes(d.status)).slice(-7).reverse();

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      {/* 1. Greeting and live clock */}
      <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-xl shadow-indigo-950/20 md:flex-row md:items-center">
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-purple-500/20 blur-2xl" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md">
            <Activity size={13} className={working ? "animate-pulse text-emerald-400" : "text-indigo-300"} />
            <span>{working ? "Clocked in" : clockedOut ? "Day complete" : "Workspace active"}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {greeting}, {user?.userName.split(" ")[0] ?? "colleague"}!
          </h1>
          <p className="text-xs text-indigo-200/80 md:text-sm">
            {now.toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-black/30 px-5 py-3 backdrop-blur-md md:self-auto">
          <Clock size={24} className="text-indigo-400" />
          <div>
            <div className="font-mono text-2xl font-bold tracking-wider tabular-nums">
              {now.toLocaleTimeString("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-indigo-300">Phnom Penh (GMT+7)</div>
          </div>
        </div>
      </div>

      {/* Result of the last punch */}
      {(message || today.error) && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs font-semibold ${
            message?.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message?.tone === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{message?.text ?? today.error}</span>
          </div>
          {message && (
            <button onClick={() => setMessage(null)} className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 2. Punch clock and shift */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Attendance punch
              </span>
              <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-zinc-100">Daily Clock In &amp; Out</h2>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                Record your attendance for today's shift. Clock-in opens at{" "}
                {t ? fmtTime(t.clockInOpensAt) : "07:00"}.
              </p>
            </div>
            {t && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>
                  {t.shift?.name ?? "Regular shift"} ({fmtTime(t.expectedStart)} – {fmtTime(t.expectedEnd)})
                </span>
              </div>
            )}
          </div>

          {!t ? (
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-zinc-800" />
          ) : (
            <div className="my-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <PunchTile
                icon={<LogIn size={14} className="text-emerald-500" />}
                label="Clock in time"
                value={t.checkInTime ? fmtTime(t.checkInTime) : "--:--"}
                note={
                  t.lateMinutes > 0
                    ? `${fmtMinutes(t.lateMinutes)} after the grace period`
                    : t.checkInTime
                      ? "On time"
                      : tooEarly
                        ? `Opens at ${fmtTime(t.clockInOpensAt)}`
                        : "Not yet clocked in"
                }
                noteTone={t.lateMinutes > 0 ? "warn" : undefined}
              />
              <PunchTile
                icon={<LogOut size={14} className="text-rose-500" />}
                label="Clock out time"
                value={t.checkOutTime ? fmtTime(t.checkOutTime) : "--:--"}
                note={
                  t.checkOutTime
                    ? t.earlyLeaveMinutes > 0
                      ? `Left ${fmtMinutes(t.earlyLeaveMinutes)} before shift end`
                      : "Workday completed"
                    : t.checkInTime
                      ? `Shift ends at ${fmtTime(t.expectedEnd)}`
                      : "Pending"
                }
                noteTone={t.earlyLeaveMinutes > 0 ? "warn" : undefined}
              />
              <PunchTile
                icon={<Flame size={14} className="text-amber-500" />}
                label="Overtime tracked"
                value={t.overtimeMinutes > 0 ? `+${fmtNumber(t.overtimeMinutes / 60)} hrs` : "0 hrs"}
                valueClass="text-amber-600 dark:text-amber-400"
                note={t.overtimeMinutes > 0 ? `${fmtMinutes(t.overtimeMinutes)} past shift end` : "Within normal shift"}
              />
            </div>
          )}

          {t?.halfDayPeriod && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/80 p-3 dark:border-indigo-800/50 dark:bg-indigo-950/40">
              <div className="shrink-0 rounded-xl bg-indigo-600 p-2 text-white">
                {t.halfDayPeriod === "Morning" ? <Sun size={16} /> : <Moon size={16} />}
              </div>
              <div className="text-xs">
                <div className="font-bold text-indigo-900 dark:text-indigo-200">
                  Approved half-day leave ({t.halfDayPeriod.toLowerCase()})
                </div>
                <div className="text-indigo-700/80 dark:text-indigo-300">
                  You're expected from {fmtTime(t.expectedStart)} to {fmtTime(t.expectedEnd)} today.
                </div>
              </div>
            </div>
          )}

          {t && <NonWorkingNotice t={t} />}

          {/* Status and action */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Today's status:</span>
              {t ? <StatusBadge status={t.status} /> : <span className="skeleton h-5 w-20" />}
              {working && (
                <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Working ({Math.floor(elapsed / 60)}h {elapsed % 60}m)
                </span>
              )}
            </div>

            <div className="flex w-full flex-col items-center gap-1.5 sm:w-auto sm:items-end">
              {t?.canClockIn ? (
                <>
                  <button
                    onClick={() => punch("in")}
                    disabled={busy || tooEarly}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                    Clock In Now
                  </button>
                  {tooEarly && (
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Clock-in opens at {fmtTime(t.clockInOpensAt)}
                    </span>
                  )}
                </>
              ) : t?.canClockOut ? (
                <button
                  onClick={() => punch("out")}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  Clock Out
                </button>
              ) : clockedOut ? (
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <Check size={14} className="text-emerald-500" />
                  Clocked out for today
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Shift schedule and shortcuts */}
        <div className="flex flex-col justify-between space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <span className="mb-4 block text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Shift schedule
            </span>
            <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">{t?.shift?.name ?? "Regular shift"}</span>
                {t?.shift?.isDefault && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">Default</span>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                <Row label="Start time" value={t ? fmtTime(t.shift?.startTime ?? t.expectedStart) : "–"} />
                <Row label="End time" value={t ? fmtTime(t.shift?.endTime ?? t.expectedEnd) : "–"} />
                {t?.halfDayPeriod && (
                  <Row label="Today (half day)" value={`${fmtTime(t.expectedStart)} – ${fmtTime(t.expectedEnd)}`} />
                )}
                <Row
                  label="Grace period"
                  value={t ? `${t.graceMinutes} mins` : "–"}
                  valueClass="text-emerald-600 dark:text-emerald-400"
                />
                <Row
                  label="Overtime after"
                  value={t ? fmtTime(t.shift?.endTime ?? t.expectedEnd) : "–"}
                  valueClass="text-amber-600 dark:text-amber-400"
                />
                <Row label="Clock-in opens" value={t ? fmtTime(t.clockInOpensAt) : "–"} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Quick shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Shortcut to={paths.myLeaves} icon={<Coffee size={16} className="text-purple-500" />} label="Request leave" />
              <Shortcut to={paths.myAttendance} icon={<CalendarCheck size={16} className="text-indigo-500" />} label="My attendance" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. This month */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
            This month ({now.toLocaleString("en-US", { month: "long" })})
          </h3>
          <span className="text-xs text-slate-400">{m ? `${m.workingDays} working days so far` : ""}</span>
        </div>
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
          <Kpi icon={<Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />} label="Days present" value={m ? `${m.presentDays}` : "–"} note={m ? `of ${m.workingDays} working days` : ""} />
          <Kpi icon={<Clock size={14} className="text-emerald-600 dark:text-emerald-400" />} label="Hours worked" value={m ? `${fmtNumber(m.workedHours)}h` : "–"} note={m ? `${fmtNumber(m.averageHoursPerDay)}h per day` : ""} />
          <Kpi icon={<Flame size={14} className="text-amber-500" />} label="Overtime" value={m ? `+${fmtNumber(m.overtimeHours)}h` : "–"} valueClass="text-amber-600 dark:text-amber-400" note="Accumulated this month" />
          <Kpi icon={<TrendingUp size={14} className="text-blue-500" />} label="On-time rate" value={m ? `${fmtNumber(m.punctualityRate)}%` : "–"} note={m ? `${m.onTimeDays} on time, ${m.lateDays} late` : ""} />
          <Kpi
            icon={<Coffee size={14} className="text-purple-500" />}
            label="Leave & half-day"
            value={m ? fmtNumber(m.leaveDays) : "–"}
            note={m ? `${m.halfDays} half-day, ${fmtNumber(m.leaveDays - m.halfDays / 2)} full-day` : ""}
            className="col-span-2 lg:col-span-1"
          />
        </div>
      </div>

      {/* 4. Recent days */}
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-zinc-100">
            <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
            My recent attendance
          </h3>
          <Link to={paths.myAttendance} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 font-semibold text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Shift</th>
                <th className="px-3 py-2.5">Check in</th>
                <th className="px-3 py-2.5">Check out</th>
                <th className="px-3 py-2.5">Hours</th>
                <th className="px-3 py-2.5">Overtime</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                    {month.loading ? "Loading…" : "Nothing recorded this month yet."}
                  </td>
                </tr>
              ) : (
                recent.map((d) => (
                  <tr key={d.date} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                    <td className="px-3 py-3 font-semibold text-slate-800 dark:text-zinc-200">{shortDate(d.date)}</td>
                    <td className="px-3 py-3 text-slate-500 dark:text-zinc-400">{d.shiftName ?? "–"}</td>
                    <td className="px-3 py-3 font-mono font-medium">{d.checkInTime ? fmtTime(d.checkInTime) : "--:--"}</td>
                    <td className="px-3 py-3 font-mono font-medium">
                      {d.missedClockOut ? <span className="text-rose-600 dark:text-rose-400">Missed</span> : d.checkOutTime ? fmtTime(d.checkOutTime) : "--:--"}
                    </td>
                    <td className="px-3 py-3 font-semibold">{d.workedMinutes ? fmtMinutes(d.workedMinutes) : "--"}</td>
                    <td className="px-3 py-3">
                      {d.overtimeMinutes > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          +{fmtMinutes(d.overtimeMinutes)}
                        </span>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="max-w-xs truncate px-3 py-3 text-slate-400">
                      {[
                        d.lateMinutes > 0 && `Late ${fmtMinutes(d.lateMinutes)}`,
                        d.earlyLeaveMinutes > 0 && `Left ${fmtMinutes(d.earlyLeaveMinutes)} early`,
                        d.leaveType && `${d.leaveType} leave`,
                        d.remark,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "–"}
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

function PunchTile({
  icon,
  label,
  value,
  note,
  valueClass = "text-slate-900 dark:text-zinc-100",
  noteTone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  valueClass?: string;
  noteTone?: "warn";
}) {
  return (
    <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`font-mono text-lg font-bold ${valueClass}`}>{value}</div>
      <p className={`text-[11px] ${noteTone === "warn" ? "font-medium text-amber-600 dark:text-amber-400" : "text-slate-400"}`}>{note}</p>
    </div>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 dark:text-zinc-400">{label}:</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function Shortcut({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-700 transition-all hover:bg-indigo-50 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-indigo-950/40"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Kpi({
  icon,
  label,
  value,
  note,
  valueClass = "text-slate-900 dark:text-zinc-100",
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  valueClass?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-extrabold ${valueClass}`}>{value}</div>
      <p className="text-[10px] text-slate-400">{note}</p>
    </div>
  );
}

// Why there's no punch today: leave, holiday, Sunday, or already marked absent.
function NonWorkingNotice({ t }: { t: EmployeeToday }) {
  const notice =
    t.status === "OnLeave"
      ? { icon: <Plane size={16} />, title: "You're on leave today", text: t.leaveType ? `${t.leaveType} leave, approved.` : "Approved leave." }
      : t.status === "Holiday"
        ? { icon: <PartyPopper size={16} />, title: "Public holiday", text: t.holidayName ?? "Enjoy the day off." }
        : t.status === "DayOff"
          ? { icon: <PartyPopper size={16} />, title: "Day off", text: "It's Sunday. See you tomorrow." }
          : t.status === "Absent"
            ? { icon: <CalendarX2 size={16} />, title: "Marked absent", text: "Clock in if you're at work, and the day will count as worked." }
            : null;
  if (!notice) return null;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <div className="shrink-0 rounded-xl bg-indigo-600 p-2 text-white">{notice.icon}</div>
      <div className="text-xs">
        <div className="font-bold text-slate-800 dark:text-zinc-100">{notice.title}</div>
        <div className="text-slate-500 dark:text-zinc-400">{notice.text}</div>
      </div>
    </div>
  );
}
