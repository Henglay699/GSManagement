import React from "react";
import { StatusBadge, AttendanceStatusValue } from "./StatusBadge";

export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string; // "YYYY-MM-DD"
  checkInTime?: string;
  checkOutTime?: string;
  totalHour?: number | string;
  status: AttendanceStatusValue;
  remark?: string;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

export interface WeekDayInfo {
  dayName: string;
  dayNumber: number;
  dateString: string;
  isHoliday?: boolean;
  holidayName?: string;
}

interface AttendanceTableProps {
  employees: Employee[];
  attendanceData: AttendanceRecord[];
  weekDates: WeekDayInfo[];
  selectedDate: string; // <-- Added to highlight selected weekday column
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  employees,
  attendanceData,
  weekDates,
  selectedDate,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-200 min-w-[950px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-700 border-b border-slate-300">
              <th className="p-3.5 border-r border-slate-200 text-xs font-semibold w-52">
                Employee
              </th>
              {weekDates.map((day) => {
                const isSelected = day.dateString === selectedDate;
                return (
                  <th
                    key={day.dateString}
                    className={`p-3.5 border-r border-slate-300 text-xs font-semibold min-w-[125px] last:border-r-0 transition-colors ${
                      isSelected
                        ? "bg-indigo-100/60 text-indigo-900 border-x-2 border-x-indigo-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{day.dayName}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-300 text-xs">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/30">
                {/* Employee Profile Cell */}
                <td className="p-3.5 border-r border-slate-300 align-top">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {emp.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        {emp.role}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Week Day Grid Cells */}
                {weekDates.map((day) => {
                  const record = attendanceData.find(
                    (att) =>
                      att.userId === emp.id && att.date === day.dateString,
                  );
                  const isSelected = day.dateString === selectedDate;
                  const isSunday = day.dayName === "Sunday"; // Check for Day Off

                  return (
                    <td
                      key={day.dateString}
                      className={`p-3 border-r border-slate-200 align-top last:border-r-0 transition-colors ${
                        isSunday ? "bg-slate-100/50" : "" // Subtle shading for Sunday
                      } ${
                        isSelected
                          ? "bg-indigo-50/40 border-x-2 border-x-indigo-400"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between h-14">
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`font-semibold text-xs ${
                              isSelected
                                ? "text-indigo-700 font-bold"
                                : "text-slate-700"
                            }`}
                          >
                            {day.dayNumber}
                          </span>

                          {day.isHoliday && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 px-1.5 py-0.5 rounded-md shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              <span>Holiday</span>
                            </span>
                          )}
                        </div>

                        <div>
                          {/* Priority: Holiday Badge -> Day Off -> Attendance Status -> Empty */}
                          {day.isHoliday ? (
                            <span
                              className="block text-[11px] text-amber-800 font-normal truncate max-w-[160px] bg-amber-100/80 border border-amber-200 px-1.5 py-0.5 rounded-md"
                              title={day.holidayName}
                            >
                              {day.holidayName || "Holiday"}
                            </span>
                          ) : isSunday ? (
                            <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                              Day Off
                            </span>
                          ) : record ? (
                            <StatusBadge
                              status={record.status}
                              totalHour={record.totalHour}
                            />
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100/70 border border-slate-200/60 px-2 py-0.5 rounded-md"></span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
