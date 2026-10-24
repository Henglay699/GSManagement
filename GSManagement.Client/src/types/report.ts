import type { SummaryEmployee, SummaryTotals } from "./attendance";

export interface MonthlyReportRow {
  employee: SummaryEmployee;
  totals: SummaryTotals;
}

export interface MonthlyReportTotals {
  employees: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  earlyLeaveDays: number;
  missedClockOuts: number;
  workedHours: number;
  overtimeHours: number;
  averageAttendanceRate: number;
  averagePunctualityRate: number;
}

/** GET /reports/monthly */
export interface MonthlyReport {
  year: number;
  month: number;
  workingDays: number;
  periodEnd: string;
  totals: MonthlyReportTotals;
  employees: MonthlyReportRow[];
}
