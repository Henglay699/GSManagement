import { api } from "../lib/api";
import type {
  DailyAttendance,
  MonthSummary,
  SaveAttendancePayload,
  WeeklyAttendance,
} from "../types/attendance";

const BASE = "/admin/attendances";

export const fetchDailyAttendance = async (date: string): Promise<DailyAttendance> => {
  const response = await api.get<DailyAttendance>(`${BASE}/daily`, { params: { date } });
  return response.data;
};

/** The Monday-to-Sunday week containing `date`. */
export const fetchWeeklyAttendance = async (date: string): Promise<WeeklyAttendance> => {
  const response = await api.get<WeeklyAttendance>(`${BASE}/weekly`, { params: { date } });
  return response.data;
};

export const createAttendance = async (data: SaveAttendancePayload): Promise<void> => {
  await api.post(BASE, data);
};

export const updateAttendance = async (id: number, data: SaveAttendancePayload): Promise<void> => {
  await api.put(`${BASE}/${id}`, data);
};

export const deleteAttendance = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};

/** One employee's month, as HR sees it (same data as the employee's own page). */
export const fetchEmployeeMonth = async (
  userId: number,
  year: number,
  month: number,
): Promise<MonthSummary> => {
  const response = await api.get<MonthSummary>(`/reports/employees/${userId}`, {
    params: { year, month },
  });
  return response.data;
};
