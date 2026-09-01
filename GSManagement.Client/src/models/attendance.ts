export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string; // "YYYY-MM-DD"
  checkInTime: string;
  checkOutTime: string;
  totalHour: number;
  status: number; // 0: Present/Active, 1: Late, 2: Leave, 3: Absent
  remark?: string;
}