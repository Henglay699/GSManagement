export interface ShiftDto {
  id: number;
  name: string;
  startTime: string; // "HH:mm" or "HH:mm:ss"
  endTime: string;
  graceMinutes: number;
  isDefault: boolean;
  // Active employees working this shift (the default counts everyone not assigned elsewhere).
  employeeCount: number;
}

/** GET /shifts/assignments: an active employee and the shift they work. */
export interface ShiftAssignment {
  userId: number;
  userName: string;
  email: string;
  imageUrl: string | null;
  roles: string;
  shiftId: number | null;
}

export interface CreateShiftDto {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  isDefault: boolean;
}

export interface UpdateShiftDto {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  isDefault: boolean;
}
