import { api } from "../lib/api";
import type {
  AttendanceGrid,
  AttendancePayload,
  AttendanceStatus,
  UserAttendanceDetail,
} from "../types/attendance";

const BASE = "/admin/attendances";

export const fetchAttendanceGrid = async (
  date: string,
  status?: AttendanceStatus,
): Promise<AttendanceGrid> => {
  const response = await api.get<AttendanceGrid>(`${BASE}/grid`, {
    params: { date, status },
  });
  return response.data;
};

// `month` is "YYYY-MM".
export const fetchUserAttendanceDetail = async (
  userId: number,
  month: string,
): Promise<UserAttendanceDetail> => {
  const response = await api.get<UserAttendanceDetail>(
    `${BASE}/user/${userId}`,
    { params: { month } },
  );
  return response.data;
};

export const createAttendance = async (
  data: AttendancePayload,
): Promise<void> => {
  await api.post(BASE, data);
};

export const updateAttendance = async (
  id: number,
  data: AttendancePayload,
): Promise<void> => {
  await api.put(`${BASE}/${id}`, data);
};
