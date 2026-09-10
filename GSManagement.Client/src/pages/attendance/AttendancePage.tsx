import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  AttendanceTable,
  Employee,
  WeekDayInfo,
  AttendanceRecord,
} from "../../components/attendance/AttendanceTable";
import {
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Clock,
  Coffee,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface WeekDayInfoDto {
  dayName: string;
  dayNumber: number;
  date: string;
  isHoliday?: boolean;
  holidayName?: string;
}

type AttendanceStatusValue = "OnTime" | "Late" | "Leave" | "Absent";

interface AttendanceRecordDto {
  id: number;
  userId: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHour?: string;
  status: AttendanceStatusValue;
  remark?: string;
}

interface EmployeeAttendanceDto {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  attendance: AttendanceRecordDto[];
}

interface AttendanceGridResponseDto {
  weekDates: WeekDayInfoDto[];
  employees: EmployeeAttendanceDto[];
}

export function AttendancePage() {
  const getTodayFormatted = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayFormatted());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Grid Data state
  const [weekDates, setWeekDates] = useState<WeekDayInfo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  // Fetch Attendance Grid Data using Axios
  const fetchAttendanceGrid = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<AttendanceGridResponseDto>(
        "/api/attendance/grid",
        {
          params: {
            date: selectedDate,
            status: statusFilter !== "all" ? statusFilter : undefined,
          },
        },
      );

      const data = response.data;

      const mappedWeekDates: WeekDayInfo[] = data.weekDates.map((w) => ({
        dayName: w.dayName,
        dayNumber: w.dayNumber,
        dateString: w.date,
        isHoliday: w.isHoliday,
        holidayName: w.holidayName,
      }));

      const mappedEmployees: Employee[] = data.employees.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        avatar: e.avatar || `https://i.pravatar.cc/150?u=${e.id}`,
      }));

      const mappedAttendance: AttendanceRecord[] = data.employees.flatMap((e) =>
        e.attendance.map((a) => ({
          id: a.id,
          userId: a.userId,
          date: a.date,
          checkInTime: a.checkInTime,
          checkOutTime: a.checkOutTime,
          totalHour: a.totalHour,
          status: a.status,
          remark: a.remark,
        })),
      );

      setWeekDates(mappedWeekDates);
      setEmployees(mappedEmployees);
      setAttendanceData(mappedAttendance);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load attendance grid",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAttendanceGrid();
  }, [fetchAttendanceGrid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, selectedDate, statusFilter]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    );
  }, [employees, searchQuery]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;

  const stats = useMemo(() => {
    const selectedDateRecords = attendanceData.filter(
      (a) => a.date === selectedDate,
    );

    const present = selectedDateRecords.filter(
      (a) => a.status === "OnTime",
    ).length;
    const late = selectedDateRecords.filter((a) => a.status === "Late").length;
    const leave = selectedDateRecords.filter(
      (a) => a.status === "Leave",
    ).length;
    const absent = selectedDateRecords.filter(
      (a) => a.status === "Absent",
    ).length;

    const totalEmployees = employees.length;
    const remainingPeople = Math.max(0, totalEmployees - present);

    return {
      present,
      late,
      leave,
      absent,
      remainingPeople,
    };
  }, [attendanceData, selectedDate, employees]);

  return (
    <div className="w-full space-y-4 text-slate-800 dark:text-zinc-100">
      {/* Title Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
          Employee Attendance
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
          Analyse attendance records of employee
        </p>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Present Today */}
        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 size={13} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
              Present
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {String(stats.present).padStart(2, "0")}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              {stats.remainingPeople} People Remaining
            </p>
          </div>
        </div>

        {/* Late Entry */}
        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
              <Clock size={13} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
              Late Entry
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {String(stats.late).padStart(2, "0")}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              {stats.present} People are on Time
            </p>
          </div>
        </div>

        {/* On Leave */}
        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
              <Coffee size={13} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
              On Leave
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {String(stats.leave).padStart(2, "0")}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              Approved Leave
            </p>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <XCircle size={13} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
              Absent
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {String(stats.absent).padStart(2, "0")}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              Without Informing
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Date Input */}
          <div className="relative flex items-center">
            <CalendarIcon
              size={13}
              className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-2 py-1 bg-emerald-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Status Filter */}
          <div className="relative flex items-center">
            <Filter
              size={12}
              className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-7 pr-7 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100/70 dark:hover:bg-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="OnTime">On Time / Present</option>
              <option value="Late">Late</option>
              <option value="Leave">Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          {/* Expanded Search Box */}
          <div className="relative flex items-center flex-1 min-w-[200px] max-w-xs">
            <Search
              size={12}
              className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search employee by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {(statusFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors px-1.5 py-0.5"
            >
              <RotateCcw size={11} />
              Reset Filters
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

      {/* Error Banner */}
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg text-[11px] font-medium">
          {error}
        </div>
      )}

      {/* Table Grid */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
        <AttendanceTable
          employees={paginatedEmployees}
          attendanceData={attendanceData}
          weekDates={weekDates}
          selectedDate={selectedDate}
        />

        {/* Pagination Footer */}
        <div className="px-3 py-2 bg-slate-50/70 dark:bg-zinc-800/70 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 font-medium">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
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
