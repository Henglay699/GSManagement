import { api } from "../lib/api";
import type {
  ClockResultDto,
  EmployeeMonthlySummary,
  EmployeeTodayStatus,
} from "../types/attendance";

const BASE = "/employee/attendance";

export const clockIn = async (): Promise<ClockResultDto> => {
  const response = await api.post<ClockResultDto>(`${BASE}/clock-in`);
  return response.data;
};

export const clockOut = async (): Promise<ClockResultDto> => {
  const response = await api.post<ClockResultDto>(`${BASE}/clock-out`);
  return response.data;
};

export const fetchTodayStatus = async (): Promise<EmployeeTodayStatus> => {
  const response = await api.get<EmployeeTodayStatus>(`${BASE}/today`);
  return response.data;
};

export const fetchMyMonthlySummary = async (
  year?: number,
  month?: number,
): Promise<EmployeeMonthlySummary> => {
  const response = await api.get<EmployeeMonthlySummary>(`${BASE}/monthly`, {
    params: { year, month },
  });
  return response.data;
};
