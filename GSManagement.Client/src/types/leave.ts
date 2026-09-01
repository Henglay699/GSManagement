// Mirrors GSManagement.Application.DTOs.LeaveRequests + the Enums namespace.
// Keep these in sync with the C# side (or generate them from an OpenAPI spec).

export type LeaveType = "Sick" | "Maternity" | "Emergency" | "Personal";

export type LeaveStatus = "Pending" | "Approved" | "Reject" | "Cancel";

export interface LeaveRequestDto {
  id: number;
  userId: number;
  userName: string;
  userImageUrl?: string | null;
  leaveType: LeaveType;
  startDate: string; // ISO date, e.g. "2026-09-01"
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  remark?: string | null;
  createdAt: string;
  actionedByUserName?: string | null;
  actionedAt?: string | null;
}

export interface CreateLeaveRequestDto {
  userId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remark?: string;
  initialStatus: LeaveStatus;
}

export interface UpdateLeaveRequestStatusDto {
  status: Extract<LeaveStatus, "Approved" | "Reject">;
  note?: string;
}

export interface LeaveRequestFilter {
  userId?: number;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  fromDate?: string;
  toDate?: string;
  search?: string;
  pageNumber: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeOption {
  id: number;
  userName: string;
  imageUrl?: string | null;
}

export interface ApiErrorBody {
  message?: string;
}