import React from "react";
import { Link } from "react-router-dom";
import { StatusBadge, AttendanceStatusValue } from "./StatusBadge";

export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
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
  selectedDate: string;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  employees,
  attendanceData,
  weekDates,
  selectedDate,
}) => {
  return (
    <div className="bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-200 dark:border-zinc-800 min-w-[950px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border-b border-slate-300 dark:border-zinc-800">
              <th className="p-3.5 border-r border-slate-200 dark:border-zinc-800 text-xs font-semibold w-52">
                Employee
              </th>
              {weekDates.map((day) => {
                const isSelected = day.dateString === selectedDate;
                return (
                  <th
                    key={day.dateString}
                    className={`p-3.5 border-r border-slate-300 dark:border-zinc-800 text-xs font-semibold min-w-[125px] last:border-r-0 transition-colors ${
                      isSelected
                        ? "bg-indigo-100/60 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-x-2 border-x-indigo-400"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{day.dayName}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-300 dark:divide-zinc-800 text-xs">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-slate-50/30 dark:hover:bg-zinc-800/30"
              >
                {/* Employee Profile Cell - links to the attendance detail page */}
                <td className="p-3.5 border-r border-slate-300 dark:border-zinc-800 align-top">
                  <Link
                    to={`/attendance/user/${emp.id}`}
                    className="!no-underline flex items-center gap-3 group"
                    title={`View ${emp.name}'s attendance details`}
                  >
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 truncate mt-0.5">
                        {emp.role}
                      </p>
                    </div>
                  </Link>
                </td>

                {/* Week Day Grid Cells */}
                {weekDates.map((day) => {
                  const record = attendanceData.find(
                    (att) =>
                      att.userId === emp.id && att.date === day.dateString,
                  );
                  const isSelected = day.dateString === selectedDate;
                  const isSunday = day.dayName === "Sunday";

                  return (
                    <td
                      key={day.dateString}
                      className={`p-3 border-r border-slate-200 dark:border-zinc-800 align-top last:border-r-0 transition-colors ${
                        isSunday ? "bg-slate-100/50 dark:bg-zinc-800/30" : ""
                      } ${
                        isSelected
                          ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-x-2 border-x-indigo-400"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between h-14">
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`font-semibold text-xs ${
                              isSelected
                                ? "text-indigo-700 dark:text-indigo-400 font-bold"
                                : "text-slate-700 dark:text-zinc-300"
                            }`}
                          >
                            {day.dayNumber}
                          </span>

                          {day.isHoliday && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-md shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              <span>Holiday</span>
                            </span>
                          )}
                        </div>

                        <div>
                          {day.isHoliday ? (
                            <span
                              className="block text-[12px] text-amber-800 dark:text-amber-300 font-normal truncate max-w-[110px] bg-amber-100/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-md"
                              title={day.holidayName}
                            >
                              {day.holidayName || "Holiday"}
                            </span>
                          ) : isSunday ? (
                            <span className="inline-flex items-center text-[11px] font-medium text-slate-500 dark:text-zinc-400 bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                              Day Off
                            </span>
                          ) : record ? (
                            <StatusBadge
                              status={record.status}
                              totalHour={record.totalHour}
                            />
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-100/70 dark:bg-zinc-800/70 border border-slate-200/60 dark:border-zinc-700/60 px-2 py-0.5 rounded-md"></span>
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
