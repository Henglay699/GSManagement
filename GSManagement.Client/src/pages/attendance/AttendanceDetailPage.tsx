import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Loader2,
  Mail,
  Flag,
} from "lucide-react";
import {
  StatusBadge,
  AttendanceStatusValue,
} from "../../components/attendance/StatusBadge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DayAttendanceRecord {
  date: string; // "YYYY-MM-DD"
  checkInTime?: string; // e.g. "08:12 AM"
  checkOutTime?: string; // e.g. "05:30 PM"
  totalHour?: number | string; // e.g. "8h 18m"
  status: AttendanceStatusValue;
  remark?: string;
}

interface MonthlyAttendanceSummary {
  present: number;
  late: number;
  absent: number;
  leave: number;
}

interface AttendanceUser {
  id: number;
  userName: string;
  email: string;
  department?: string;
  avatarUrl?: string;
}

interface HolidayInfo {
  date: string; // "YYYY-MM-DD"
  name: string;
}

interface AttendanceDetailResponse {
  user: AttendanceUser;
  summary: MonthlyAttendanceSummary;
  records: DayAttendanceRecord[];
  holidays: HolidayInfo[];
}

// ---------------------------------------------------------------------------
// Date / time helpers
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

const toDateKey = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

function timeToMinutes(time?: string): number | null {
  if (!time) return null;
  const match = time.trim().match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Visual timeline spans 6:00 AM to 8:00 PM
const DAY_START_MIN = 6 * 60;
const DAY_END_MIN = 20 * 60;

// Standard shift window used to compute the "arrived/left" notes below.
// Swap these for a real per-employee schedule once you have one.
const SHIFT_START_MIN = 8 * 60; // 8:00 AM
const SHIFT_END_MIN = 17 * 60; // 5:00 PM

function percentFromMinutes(mins: number): number {
  const clamped = Math.min(Math.max(mins, DAY_START_MIN), DAY_END_MIN);
  return ((clamped - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100;
}

function positionPercent(time?: string): number {
  const mins = timeToMinutes(time);
  return mins == null ? 0 : percentFromMinutes(mins);
}

function describeVariance(
  actualMinutes: number,
  scheduledMinutes: number,
  earlyWord: string,
  lateWord: string,
  onTimeWord: string,
): string {
  const diff = actualMinutes - scheduledMinutes;
  if (Math.abs(diff) <= 5) return onTimeWord;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return diff > 0 ? `${duration} ${lateWord}` : `${duration} ${earlyWord}`;
}

function getArrivalNote(checkInTime: string): string | null {
  const mins = timeToMinutes(checkInTime);
  if (mins == null) return null;
  const variance = describeVariance(
    mins,
    SHIFT_START_MIN,
    "before shift start",
    "after shift start",
    "right on time",
  );
  return `Clocked in ${variance}`;
}

function getDepartureNote(checkOutTime: string): string | null {
  const mins = timeToMinutes(checkOutTime);
  if (mins == null) return null;
  const variance = describeVariance(
    mins,
    SHIFT_END_MIN,
    "before shift end",
    "after shift end",
    "right on time",
  );
  return `Clocked out ${variance}`;
}

const STATUS_DOT: Record<AttendanceStatusValue, string> = {
  OnTime: "bg-emerald-500",
  Late: "bg-amber-500",
  Leave: "bg-purple-500",
  Absent: "bg-rose-500",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function formatFullDateLabel(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDateLabel(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function UserAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const [data, setData] = useState<AttendanceDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    if (!id) return;

    const loadDetail = async () => {
      setLoading(true);
      try {
        const monthParam = `${viewYear}-${pad(viewMonth + 1)}`;
        const response = await axios.get<AttendanceDetailResponse>(
          `/api/attendance/user/${id}`,
          { params: { month: monthParam } },
        );
        setData(response.data);
        setErrorMessage(undefined);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.message ||
              "Failed to load attendance details.",
          );
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, viewYear, viewMonth]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, DayAttendanceRecord>();
    (data?.records ?? []).forEach((r) => map.set(r.date, r));
    return map;
  }, [data]);

  const holidaysByDate = useMemo(() => {
    const map = new Map<string, HolidayInfo>();
    (data?.holidays ?? []).forEach((h) => map.set(h.date, h));
    return map;
  }, [data]);

  const selectedRecord = recordsByDate.get(selectedDate);
  const selectedHoliday = holidaysByDate.get(selectedDate);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const calendarCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goToPrevMonth = () => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goToNextMonth = () => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  // Attendance rate excludes approved leave from the denominator, since
  // leave is authorized and shouldn't count against the employee.
  const attendanceRate = useMemo(() => {
    if (!data) return null;
    const { present, late, absent } = data.summary;
    const trackedDays = present + late + absent;
    if (trackedDays === 0) return null;
    return Math.round(((present + late) / trackedDays) * 100);
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
        <span className="text-sm">Loading attendance details...</span>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 text-center space-y-4">
        <div className="text-rose-500 dark:text-rose-400 font-medium text-sm">
          {errorMessage || "Attendance data not found"}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  const { user, summary, records } = data;

  return (
    <div className="max-w-[1200px] mx-auto p-2 space-y-5">
      {/* Header: identity + attendance rate on the left, month switcher on the right */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 font-bold text-xs overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.userName}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(user.userName)
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-base font-bold text-slate-800 dark:text-zinc-100 truncate">
              {user.userName}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
              <Mail size={11} className="shrink-0" />
              <span className="truncate">{user.email}</span>
              {user.department && (
                <>
                  <span className="text-slate-300 dark:text-zinc-600">/</span>
                  <span className="truncate">{user.department}</span>
                </>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200 dark:border-zinc-800">
            <AttendanceRing percent={attendanceRate} />
            <span className="text-xs text-slate-500 dark:text-zinc-400 leading-tight max-w-[6.5rem]">
              attendance this month
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 shadow-2xs">
          <button
            onClick={goToPrevMonth}
            className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 w-28 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
        {/* ================= TIME CARD (hero) ================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <p className="text-[13px] text-slate-400 dark:text-zinc-500">
                Time card
              </p>
              <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                {formatFullDateLabel(selectedDate)}
              </h2>
            </div>
            {selectedHoliday ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-2.5 py-1 rounded-full shrink-0">
                <Flag size={11} />
                Public holiday
              </span>
            ) : (
              selectedRecord && (
                <StatusBadge
                  status={selectedRecord.status}
                  totalHour={undefined}
                />
              )
            )}
          </div>

          {selectedHoliday ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-1.5">
              <p className="text-[16px] font-semibold text-red-500 dark:text-red-400">
                {selectedHoliday.name}
              </p>
              <p className="text-s text-slate-400 dark:text-zinc-500">
                Public holiday - no work expected in this day.
              </p>
            </div>
          ) : !selectedRecord ? (
            <div className="flex-1 flex items-center justify-center py-10 text-center text-sm text-slate-400 dark:text-zinc-500">
              No attendance record for this day.
            </div>
          ) : selectedRecord.status === "Absent" ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-1.5">
              <p className="text-sm text-slate-600 dark:text-zinc-300">
                Marked absent for this day.
              </p>
              {selectedRecord.remark && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
                  {selectedRecord.remark}
                </p>
              )}
            </div>
          ) : selectedRecord.status === "Leave" ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-1.5">
              <p className="text-sm text-slate-600 dark:text-zinc-300">
                On approved leave this day.
              </p>
              {selectedRecord.remark && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-xs">
                  {selectedRecord.remark}
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              {/* Punch-clock readout */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-3xl font-bold font-mono tabular-nums text-slate-800 dark:text-zinc-100">
                    {selectedRecord.checkInTime || "--:--"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    Check in
                  </p>
                </div>

                <div className="text-center px-3">
                  <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {selectedRecord.totalHour ?? "--"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    worked
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold font-mono tabular-nums text-slate-800 dark:text-zinc-100">
                    {selectedRecord.checkOutTime || "--:--"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
                    Check out
                  </p>
                </div>
              </div>

              {/* Timeline with a shaded band for the scheduled shift */}
              <div className="relative h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800 mt-8 mx-2">
                <div
                  className="absolute top-0 h-full rounded-full bg-slate-200/80 dark:bg-zinc-700/60"
                  style={{
                    left: `${percentFromMinutes(SHIFT_START_MIN)}%`,
                    width: `${
                      percentFromMinutes(SHIFT_END_MIN) -
                      percentFromMinutes(SHIFT_START_MIN)
                    }%`,
                  }}
                  title="Scheduled shift (8:00 AM – 5:00 PM)"
                />

                {selectedRecord.checkInTime && selectedRecord.checkOutTime && (
                  <div
                    className="absolute top-0 h-full rounded-full bg-indigo-500 motion-safe:transition-all motion-safe:duration-300"
                    style={{
                      left: `${positionPercent(selectedRecord.checkInTime)}%`,
                      width: `${Math.max(
                        positionPercent(selectedRecord.checkOutTime) -
                          positionPercent(selectedRecord.checkInTime),
                        0,
                      )}%`,
                    }}
                  />
                )}

                {selectedRecord.checkInTime && (
                  <div
                    className="absolute -top-2 motion-safe:transition-all motion-safe:duration-300"
                    style={{
                      left: `calc(${positionPercent(selectedRecord.checkInTime)}% - 11px)`,
                    }}
                  >
                    <div className="w-[22px] h-[22px] rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-900 shadow-md flex items-center justify-center">
                      <LogIn size={10} className="text-white" />
                    </div>
                  </div>
                )}

                {selectedRecord.checkOutTime && (
                  <div
                    className="absolute -top-2 motion-safe:transition-all motion-safe:duration-300"
                    style={{
                      left: `calc(${positionPercent(selectedRecord.checkOutTime)}% - 11px)`,
                    }}
                  >
                    <div className="w-[22px] h-[22px] rounded-full bg-rose-500 border-4 border-white dark:border-zinc-900 shadow-md flex items-center justify-center">
                      <LogOut size={10} className="text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Arrival / departure notes, plain language */}
              <div className="flex items-center justify-between mt-4 px-1 text-xs text-slate-500 dark:text-zinc-400">
                <span>
                  {selectedRecord.checkInTime &&
                    getArrivalNote(selectedRecord.checkInTime)}
                </span>
                <span>
                  {selectedRecord.checkOutTime &&
                    getDepartureNote(selectedRecord.checkOutTime)}
                </span>
              </div>

              {selectedRecord.remark && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-4 px-1 border-t border-slate-100 dark:border-zinc-800 pt-3">
                  {selectedRecord.remark}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ================= MONTHLY RHYTHM ================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-5">
          {/* Calendar */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((d, i) => (
              <span
                key={`${d}-${i}`}
                className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 py-1"
              >
                {d}
              </span>
            ))}

            {calendarCells.map((day, idx) => {
              if (day === null) return <span key={`empty-${idx}`} />;

              const dateKey = toDateKey(viewYear, viewMonth, day);
              const record = recordsByDate.get(dateKey);
              const holiday = holidaysByDate.get(dateKey);
              const isSelected = dateKey === selectedDate;
              const isToday =
                dateKey ===
                toDateKey(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                );

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(dateKey)}
                  title={holiday?.name}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs font-medium transition-colors ${
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

          {/* Composition bar - replaces separate stat cards */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            <CompositionBar summary={summary} />
          </div>

          {/* Flagged days */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-2">
              Late or absent this month
            </p>
            <FlaggedDaysList
              records={records}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function AttendanceRing({ percent }: { percent: number | null }) {
  const size = 46;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = percent ?? 0;
  const offset = circumference - (safePercent / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-zinc-800"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-indigo-600 dark:stroke-indigo-400 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold font-mono text-slate-800 dark:text-zinc-100">
          {percent == null ? "—" : `${percent}%`}
        </span>
      </div>
    </div>
  );
}

function CompositionBar({ summary }: { summary: MonthlyAttendanceSummary }) {
  const segments = [
    {
      key: "present",
      label: "On time",
      value: summary.present,
      color: "bg-emerald-500",
    },
    { key: "late", label: "Late", value: summary.late, color: "bg-amber-500" },
    {
      key: "absent",
      label: "Absent",
      value: summary.absent,
      color: "bg-rose-500",
    },
    {
      key: "leave",
      label: "Leave",
      value: summary.leave,
      color: "bg-purple-500",
    },
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

function FlaggedDaysList({
  records,
  selectedDate,
  onSelect,
}: {
  records: DayAttendanceRecord[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
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
    <div className="space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      {flagged.map((r) => {
        const isSelected = r.date === selectedDate;
        return (
          <button
            key={r.date}
            onClick={() => onSelect(r.date)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
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

export default UserAttendanceDetailPage;
