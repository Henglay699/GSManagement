import { api } from "../lib/api";
import type { PagedResult } from "../types/common";
import type {
  CreateLeaveRequestDto,
  LeaveRequestDto,
  LeaveRequestFilter,
  UpdateLeaveRequestDto,
  UpdateLeaveRequestStatusDto,
} from "../types/leave";

const BASE = "/leave-requests";

export const fetchLeaveRequests = async (
  filter: LeaveRequestFilter,
): Promise<PagedResult<LeaveRequestDto>> => {
  // Drop empty filters so they aren't sent as "?status=".
  const params = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== ""),
  );
  const response = await api.get<PagedResult<LeaveRequestDto>>(BASE, {
    params,
  });
  return response.data;
};

export const fetchPendingLeaveCount = async (): Promise<number> => {
  const response = await api.get<number>(`${BASE}/pending-count`);
  return response.data;
};

export const fetchLeaveRequestById = async (
  id: number,
): Promise<LeaveRequestDto> => {
  const response = await api.get<LeaveRequestDto>(`${BASE}/${id}`);
  return response.data;
};

export const createLeaveRequest = async (
  data: CreateLeaveRequestDto,
): Promise<LeaveRequestDto> => {
  const response = await api.post<LeaveRequestDto>(BASE, data);
  return response.data;
};

export const updateLeaveRequest = async (
  id: number,
  data: UpdateLeaveRequestDto,
): Promise<LeaveRequestDto> => {
  const response = await api.put<LeaveRequestDto>(`${BASE}/${id}`, data);
  return response.data;
};

export const updateLeaveRequestStatus = async (
  id: number,
  data: UpdateLeaveRequestStatusDto,
): Promise<LeaveRequestDto> => {
  const response = await api.put<LeaveRequestDto>(`${BASE}/${id}/status`, data);
  return response.data;
};

export const deleteLeaveRequest = async (id: number): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};
