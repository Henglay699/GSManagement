import axios from "axios";
import { AttendanceRecord} from "../components/attendance/AttendanceTable";
import { AttendanceStatusValue } from "../components/attendance/StatusBadge";

export interface CreateAttendanceDto {
  userId: number;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatusValue;
  remark?: string;
}

export const createAttendance = async (data: CreateAttendanceDto): Promise<AttendanceRecord> => {
  const response = await axios.post<AttendanceRecord>("/api/attendance", data);
  return response.data;
};