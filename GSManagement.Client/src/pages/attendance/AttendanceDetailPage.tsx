import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
} from "lucide-react";
import AttendanceFormModal from "../../components/attendance/AttendanceFormModal";
import AttendanceRing from "../../components/attendance/AttendanceRing";
import CompositionBar from "../../components/attendance/CompositionBar";
import FlaggedDaysList from "../../components/attendance/FlaggedDaysList";
import MonthCalendar from "../../components/attendance/MonthCalendar";
import TimeCard from "../../components/attendance/TimeCard";
import { useAsync } from "../../hooks/useAsync";
import { paths } from "../../lib/paths";
import { fetchUserAttendanceDetail } from "../../services/attendanceService";
import type { DayAttendanceRecord, Holiday } from "../../types/attendance";
import {
  todayKey as getTodayKey,
  toMonthKey,
} from "../../utils/dateTimeFormatter";
import { getInitials } from "../../utils/string";
import ZoomablePhoto from "../../components/ui/ZoomablePhoto";

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

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; record: DayAttendanceRecord & { id: number } };

export function UserAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [todayKey] = useState(getTodayKey);

  // Start on "?date=YYYY-MM-DD" when given, otherwise today.
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get("date");
    return dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayKey;
  });
  const [view, setView] = useState(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const [modal, setModal] = useState<ModalState>({ mode: "closed" });

  const { data, loading, error, reload } = useAsync(
    useCallback(
      () =>
        fetchUserAttendanceDetail(userId, toMonthKey(view.year, view.month)),
      [userId, view],
    ),
    "Failed to load attendance details.",
  );

  const recordsByDate = useMemo(
    () =>
      new Map<string, DayAttendanceRecord>(
        (data?.records ?? []).map((r) => [r.date, r]),
      ),
    [data],
  );
  const holidaysByDate = useMemo(
    () =>
      new Map<string, Holiday>((data?.holidays ?? []).map((h) => [h.date, h])),
    [data],
  );

  const attendanceRate = useMemo(() => {
    if (!data) return null;
    const { present, late, absent } = data.summary;
    const trackedDays = present + late + absent;
    if (trackedDays === 0) return null;
    return Math.round(((present + late) / trackedDays) * 100);
  }, [data]);

  const shiftMonth = (delta: number) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const handleEdit = (record: DayAttendanceRecord) => {
    if (record.status === "Leave") return;
    const recordId =
      record.id ?? (record as { attendanceId?: number }).attendanceId;
    if (!recordId) {
      alert("Error: Attendance record ID is missing.");
      return;
    }
    setModal({ mode: "edit", record: { ...record, id: recordId } });
  };

  const handleViewLeave = (record: DayAttendanceRecord) =>
    navigate(
      record.leaveRequestId
        ? paths.leaveDetail(record.leaveRequestId)
        : paths.leaveHistory,
    );

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
        <span className="text-sm">Loading attendance details...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 text-center space-y-4">
        <div className="text-rose-500 dark:text-rose-400 font-medium text-sm">
          {error || "Attendance data not found"}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
        >
          Go back
        </button>
      </div>
    );
  }

  const { user, summary, records } = data;

  return (
    <div className="max-w-[1200px] mx-auto p-2 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 font-bold text-xs overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <ZoomablePhoto
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
            onClick={() => shiftMonth(-1)}
            className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 w-28 text-center">
            {MONTH_NAMES[view.month]} {view.year}
          </span>
          <button
            onClick={() => shiftMonth(1)}
            className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
        <TimeCard
          date={selectedDate}
          record={recordsByDate.get(selectedDate)}
          holiday={holidaysByDate.get(selectedDate)}
          onCreate={() => setModal({ mode: "create" })}
          onEdit={handleEdit}
          onViewLeave={handleViewLeave}
        />

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-5">
          <MonthCalendar
            year={view.year}
            month={view.month}
            selectedDate={selectedDate}
            todayKey={todayKey}
            recordsByDate={recordsByDate}
            holidaysByDate={holidaysByDate}
            onSelect={setSelectedDate}
          />

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
            <CompositionBar summary={summary} />
          </div>

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

      {modal.mode !== "closed" && (
        <AttendanceFormModal
          userId={userId}
          date={selectedDate}
          record={modal.mode === "edit" ? modal.record : undefined}
          onClose={() => setModal({ mode: "closed" })}
          onSaved={() => {
            setModal({ mode: "closed" });
            reload();
          }}
        />
      )}
    </div>
  );
}

export default UserAttendanceDetailPage;
