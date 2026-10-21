import { api } from "../lib/api";
import type { PagedResult } from "../types/common";
import type {
  CreateMyLeaveRequestDto,
  LeaveRequestDto,
  LeaveRequestFilter,
} from "../types/leave";

// The logged-in employee's own leave requests.
const BASE = "/employee/leaves";

export const fetchMyLeaveRequests = async (
  filter: Pick<LeaveRequestFilter, "status" | "pageNumber" | "pageSize">,
): Promise<PagedResult<LeaveRequestDto>> => {
  const params = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined),
  );
  const response = await api.get<PagedResult<LeaveRequestDto>>(BASE, {
    params,
  });
  return response.data;
};

export const createMyLeaveRequest = async (
  data: CreateMyLeaveRequestDto,
): Promise<LeaveRequestDto> => {
  const response = await api.post<LeaveRequestDto>(BASE, data);
  return response.data;
};

export const cancelMyLeaveRequest = async (
  id: number,
): Promise<LeaveRequestDto> => {
  const response = await api.put<LeaveRequestDto>(`${BASE}/${id}/cancel`);
  return response.data;
};
