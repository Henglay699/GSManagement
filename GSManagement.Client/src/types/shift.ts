export interface ShiftDto {
  id: number;
  name: string;
  startTime: string; // "HH:mm" or "HH:mm:ss"
  endTime: string;
  graceMinutes: number;
  isDefault: boolean;
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
