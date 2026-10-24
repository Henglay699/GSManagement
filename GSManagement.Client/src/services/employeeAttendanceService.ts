import { api } from "../lib/api";
import type { ClockResult, EmployeeToday, MonthSummary } from "../types/attendance";

// The logged-in employee's own attendance.
const BASE = "/employee/attendance";

export const clockIn = async (): Promise<ClockResult> => {
  const response = await api.post<ClockResult>(`${BASE}/clock-in`);
  return response.data;
};

export const clockOut = async (): Promise<ClockResult> => {
  const response = await api.post<ClockResult>(`${BASE}/clock-out`);
  return response.data;
};

export const fetchToday = async (): Promise<EmployeeToday> => {
  const response = await api.get<EmployeeToday>(`${BASE}/today`);
  return response.data;
};

export const fetchMySummary = async (year: number, month: number): Promise<MonthSummary> => {
  const response = await api.get<MonthSummary>(`${BASE}/summary`, { params: { year, month } });
  return response.data;
};
