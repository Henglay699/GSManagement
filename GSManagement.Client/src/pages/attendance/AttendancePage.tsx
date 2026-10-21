import { useCallback, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { AttendanceTable } from "../../components/attendance/AttendanceTable";
import AttendanceSummaryCards from "../../components/attendance/AttendanceSummaryCards";
import { useAsync } from "../../hooks/useAsync";
import { fetchAttendanceGrid } from "../../services/attendanceService";
import type { AttendanceStatus } from "../../types/attendance";
import { addDays, todayKey } from "../../utils/dateTimeFormatter";

export function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, loading, error } = useAsync(
    useCallback(
      () =>
        fetchAttendanceGrid(
          selectedDate,
          statusFilter === "all" ? undefined : statusFilter,
        ),
      [selectedDate, statusFilter],
    ),
    "Failed to load attendance grid",
  );

  const weekDates = useMemo(() => data?.weekDates ?? [], [data]);
  const employees = useMemo(() => data?.employees ?? [], [data]);

  // Any filter change goes back to the first page.
  const resetPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setCurrentPage(1);
      setter(value);
    };

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return employees;
    return employees.filter((emp) => emp.name.toLowerCase().includes(query));
  }, [employees, searchQuery]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;

  const stats = useMemo(() => {
    const records = employees
      .flatMap((e) => e.attendance)
      .filter((a) => a.date === selectedDate);
    const count = (status: AttendanceStatus) =>
      records.filter((a) => a.status === status).length;
    return {
      present: count("OnTime"),
      late: count("Late"),
      leave: count("Leave"),
      absent: count("Absent"),
    };
  }, [employees, selectedDate]);

  return (
    <div className="w-full space-y-4 text-slate-800 dark:text-zinc-100">
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
          Employee Attendance Overview
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
          Analyse attendance records of employees
        </p>
      </div>

      <AttendanceSummaryCards {...stats} totalEmployees={employees.length} />

      {/* Control Bar */}
      <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex items-center">
            <CalendarIcon
              size={13}
              className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => resetPage(setSelectedDate)(e.target.value)}
              className="pl-8 pr-2 py-1 bg-emerald-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="relative flex items-center">
            <Filter
              size={12}
              className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                resetPage(setStatusFilter)(
                  e.target.value as AttendanceStatus | "all",
                )
              }
              className="pl-7 pr-7 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="OnTime">On Time / Present</option>
              <option value="Late">Late</option>
              <option value="Leave">Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="relative flex items-center flex-1 min-w-[180px] max-w-xs">
            <Search
              size={12}
              className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => resetPage(setSearchQuery)(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-0.5">
            <button
              onClick={() => resetPage(setSelectedDate)(addDays(selectedDate, -7))}
              className="p-1 rounded-md text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200 px-1.5 whitespace-nowrap">
              {weekDates.length > 0
                ? `${weekDates[0].date} – ${weekDates[weekDates.length - 1].date}`
                : selectedDate}
            </span>

            <button
              onClick={() => resetPage(setSelectedDate)(addDays(selectedDate, 7))}
              className="p-1 rounded-md text-slate-600 dark:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors"
              title="Next Week"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {(statusFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setCurrentPage(1);
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors px-1.5 py-0.5"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 pr-2">
            <Loader2 size={13} className="animate-spin" />
            Loading grid...
          </div>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-[11px] font-medium">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
        <AttendanceTable
          employees={paginatedEmployees}
          weekDates={weekDates}
          selectedDate={selectedDate}
        />

        {/* Pagination Footer */}
        <div className="px-3 py-2 bg-slate-50/70 dark:bg-zinc-800/70 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 font-medium">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => resetPage(setPageSize)(Number(e.target.value))}
              className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-1.5 py-0.5 font-semibold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="ml-2">
              Showing{" "}
              {filteredEmployees.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}{" "}
              to {Math.min(currentPage * pageSize, filteredEmployees.length)} of{" "}
              {filteredEmployees.length} employees
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-semibold text-slate-700 dark:text-zinc-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendancePage;
