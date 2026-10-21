import type { ShiftDto } from "./shift";

export type AttendanceStatus =
  | "OnTime"
  | "Late"
  | "Leave"
  | "Absent"
  | "HalfDayLeave";

export type HalfDayPeriod = "Morning" | "Afternoon";

// "Leave" and "HalfDayLeave" are set by approved leave requests, never entered by hand.
export type ManualAttendanceStatus = Exclude<
  AttendanceStatus,
  "Leave" | "HalfDayLeave"
>;

export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string; // "YYYY-MM-DD"
  checkInTime?: string; // e.g. "08:12 AM" or "08:12:00"
  checkOutTime?: string;
  totalHour?: number | string;
  overtimeMinutes?: number | null;
  isHalfDay?: boolean;
  halfDayPeriod?: HalfDayPeriod | null;
  shiftId?: number | null;
  shiftName?: string | null;
  status: AttendanceStatus;
  remark?: string;
}

// ---- GET /api/admin/attendances/grid ----

export interface WeekDay {
  dayName: string;
  dayNumber: number;
  date: string;
  isHoliday?: boolean;
  holidayName?: string;
}

export interface EmployeeAttendance {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  attendance: AttendanceRecord[];
}

export interface AttendanceGrid {
  weekDates: WeekDay[];
  employees: EmployeeAttendance[];
}

// ---- GET /api/admin/attendances/user/{id} ----

export interface DayAttendanceRecord
  extends Omit<AttendanceRecord, "id" | "userId"> {
  id?: number;
  leaveRequestId?: number;
}

export interface MonthlyAttendanceSummary {
  present: number;
  late: number;
  absent: number;
  leave: number;
  halfDayLeave?: number;
  totalOvertimeHours?: number;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface UserAttendanceDetail {
  user: {
    id: number;
    userName: string;
    email: string;
    department?: string;
    avatarUrl?: string;
  };
  summary: MonthlyAttendanceSummary;
  records: DayAttendanceRecord[];
  holidays: Holiday[];
}

// ---- POST / PUT /api/admin/attendances ----

export interface AttendancePayload {
  userId: number;
  date: string;
  checkInTime: string | null; // "HH:mm"
  checkOutTime: string | null;
  status: ManualAttendanceStatus;
  remark: string | null;
  shiftId?: number | null;
  overtimeMinutes?: number | null;
  isHalfDay?: boolean;
  halfDayPeriod?: HalfDayPeriod | null;
}

// ---- Employee Clock-In / Clock-Out ----

export interface ClockResultDto {
  id: number;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalHours?: number | null;
  overtimeMinutes?: number | null;
  status: AttendanceStatus;
  remark?: string | null;
  shiftName?: string | null;
  message: string;
}

export interface EmployeeTodayStatus {
  date: string;
  isClockedIn: boolean;
  isClockedOut: boolean;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalHours?: number | null;
  overtimeMinutes?: number | null;
  status?: AttendanceStatus | null;
  shift?: ShiftDto | null;
  isHalfDay: boolean;
  halfDayPeriod?: HalfDayPeriod | null;
}

export interface EmployeeAttendanceRecordDto {
  id: number;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalHours?: number | null;
  overtimeMinutes?: number | null;
  status: AttendanceStatus;
  remark?: string | null;
  isHalfDay: boolean;
  halfDayPeriod?: HalfDayPeriod | null;
  shiftName?: string | null;
}

export interface EmployeeMonthlySummary {
  year: number;
  month: number;
  totalDaysWorked: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  totalOnTime: number;
  totalLate: number;
  totalLeave: number;
  totalAbsent: number;
  totalHalfDayLeave: number;
  records: EmployeeAttendanceRecordDto[];
}
