export type LeaveType = "Sick" | "Maternity" | "Emergency" | "Personal";

export type LeaveStatus = "Pending" | "Approved" | "Reject" | "Cancel";

export type HalfDayPeriod = "Morning" | "Afternoon";

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
  approverName?: string | null;
  actionedAt?: string | null;
  isHalfDay?: boolean;
  halfDayPeriod?: HalfDayPeriod | null;
}

export interface CreateLeaveRequestDto {
  userId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remark?: string;
  initialStatus: LeaveStatus;
  isHalfDay?: boolean;
  halfDayPeriod?: HalfDayPeriod | null;
}

// POST /api/employee/leaves: the employee is taken from the login.
export type CreateMyLeaveRequestDto = Omit<
  CreateLeaveRequestDto,
  "userId" | "initialStatus"
>;

export interface UpdateLeaveRequestDto {
  userId: number;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  remark?: string;
  isHalfDay?: boolean;
  halfDayPeriod?: HalfDayPeriod | null;
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

export const LEAVE_TYPES: LeaveType[] = ["Sick", "Maternity", "Emergency", "Personal"];
