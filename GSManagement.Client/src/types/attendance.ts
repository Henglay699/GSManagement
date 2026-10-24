import type { ShiftDto } from "./shift";
import type { HalfDayPeriod, LeaveType } from "./leave";

export type { HalfDayPeriod };

/** What a stored record says about a day (AttendanceStatus on the server). */
export type AttendanceStatus = "Present" | "Late" | "HalfDay" | "OnLeave" | "Absent";

/**
 * What a calendar day shows: exactly one per day. The first five come from
 * stored records, the rest from the calendar (DayStatus on the server).
 */
export type DayStatus =
  | "Present"
  | "Late"
  | "HalfDay"
  | "OnLeave"
  | "Absent"
  | "InProgress"
  | "NotClockedIn"
  | "Holiday"
  | "DayOff"
  | "Upcoming"
  | "NoRecord";

export interface SummaryEmployee {
  id: number;
  userName: string;
  email: string;
  imageUrl: string | null;
  roles: string;
}

export interface SummaryDay {
  date: string; // "YYYY-MM-DD"
  status: DayStatus;
  attendanceId: number | null;
  holidayName: string | null;
  checkInTime: string | null; // "HH:mm:ss"
  checkOutTime: string | null;
  workedMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  missedClockOut: boolean;
  leaveType: LeaveType | null;
  halfDayPeriod: HalfDayPeriod | null;
  shiftName: string | null;
  remark: string | null;
  // "HH:mm:ss": when work was expected that day; null on days off, holidays and leave.
  expectedStart: string | null;
  expectedEnd: string | null;
}

export interface SummaryTotals {
  workingDays: number;
  presentDays: number;
  onTimeDays: number;
  lateDays: number;
  lateMinutes: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  earlyLeaveDays: number;
  missedClockOuts: number;
  workedHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  attendanceRate: number;
  punctualityRate: number;
  leaveByType: Record<LeaveType, number>;
}

/** GET /employee/attendance/summary and /reports/employees/{id} */
export interface MonthSummary {
  year: number;
  month: number;
  periodEnd: string;
  employee: SummaryEmployee;
  totals: SummaryTotals;
  days: SummaryDay[];
}

/** GET /admin/attendances/daily */
export interface DailyAttendance {
  date: string;
  holidayName: string | null;
  isDayOff: boolean;
  counts: Record<DayStatus, number>;
  rows: { employee: SummaryEmployee; day: SummaryDay }[];
}

/** GET /admin/attendances/weekly: Monday to Sunday. */
export interface WeeklyAttendance {
  weekStart: string;
  weekEnd: string;
  days: { date: string; holidayName: string | null; isDayOff: boolean }[];
  // Each row's days are in the same order as `days`.
  rows: { employee: SummaryEmployee; days: SummaryDay[] }[];
}

/** POST / PUT /admin/attendances. The status is worked out from the times. */
export interface SaveAttendancePayload {
  userId: number;
  date: string;
  checkInTime: string | null; // "HH:mm"
  checkOutTime: string | null;
  markAbsent: boolean;
  remark: string | null;
}

/** GET /employee/attendance/today */
export interface EmployeeToday {
  date: string;
  status: DayStatus;
  canClockIn: boolean;
  canClockOut: boolean;
  // "HH:mm:ss": clock-in is refused before this time.
  clockInOpensAt: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedStart: string;
  expectedEnd: string;
  graceMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  holidayName: string | null;
  leaveType: LeaveType | null;
  halfDayPeriod: HalfDayPeriod | null;
  shift: ShiftDto | null;
}

export interface ClockResult {
  today: EmployeeToday;
  message: string;
}
