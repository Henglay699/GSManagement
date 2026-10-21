import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { paths } from "../../lib/paths";
import type { EmployeeAttendance, WeekDay } from "../../types/attendance";

interface AttendanceTableProps {
  employees: EmployeeAttendance[];
  weekDates: WeekDay[];
  selectedDate: string;
}

export function AttendanceTable({
  employees,
  weekDates,
  selectedDate,
}: AttendanceTableProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-200 dark:border-zinc-800 min-w-[950px]">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800">
              <th className="p-3.5 border-r border-slate-200 dark:border-zinc-800 text-xs font-semibold w-52">
                Employee
              </th>
              {weekDates.map((day) => {
                const isSelected = day.date === selectedDate;
                return (
                  <th
                    key={day.date}
                    className={`p-3.5 border-r border-slate-200 dark:border-zinc-800 text-xs font-semibold min-w-[125px] last:border-r-0 transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-x-2 border-x-indigo-500"
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

          <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 text-xs">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30"
              >
                {/* Employee Profile Cell */}
                <td className="p-3.5 border-r border-slate-200 dark:border-zinc-800 align-top">
                  <Link
                    to={paths.userAttendance(emp.id, selectedDate)}
                    className="flex items-center gap-3 group"
                    title={`View ${emp.name}'s attendance details`}
                  >
                    <img
                      src={
                        emp.avatar || `https://i.pravatar.cc/150?u=${emp.id}`
                      }
                      alt={emp.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-xs truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                        {emp.role}
                      </p>
                    </div>
                  </Link>
                </td>

                {/* Week Day Grid Cells */}
                {weekDates.map((day) => {
                  const record = emp.attendance.find(
                    (a) => a.date === day.date,
                  );
                  const isSelected = day.date === selectedDate;
                  const isSunday = day.dayName === "Sunday";

                  return (
                    <td
                      key={day.date}
                      className={`p-1 border-r border-slate-200 dark:border-zinc-800 align-top last:border-r-0 transition-colors ${
                        isSunday ? "bg-slate-50/60 dark:bg-zinc-800/30" : ""
                      } ${
                        isSelected
                          ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-x-2 border-x-indigo-500"
                          : ""
                      }`}
                    >
                      <Link
                        to={paths.userAttendance(emp.id, day.date)}
                        className="flex flex-col justify-between h-14 p-2 rounded-lg group hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 transition-colors"
                        title={`View ${emp.name}'s details for ${day.date}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`font-semibold text-xs ${
                              isSelected
                                ? "text-indigo-700 dark:text-indigo-400 font-bold"
                                : "text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                            }`}
                          >
                            {day.dayNumber}
                          </span>

                          {day.isHoliday && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-md shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              <span>{day.date}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 items-start">
                          {day.isHoliday ? (
                            <span
                              className="block text-[11px] text-amber-800 dark:text-amber-300 font-normal truncate max-w-[110px] bg-amber-100/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-md"
                              title={day.holidayName}
                            >
                              {day.holidayName || "Holiday"}
                            </span>
                          ) : isSunday ? (
                            <span className="inline-flex items-center text-[10px] font-medium text-slate-500 dark:text-zinc-400 bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                              Day Off
                            </span>
                          ) : record ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              <StatusBadge
                                status={record.status}
                                totalHour={record.totalHour}
                              />
                              {record.overtimeMinutes && record.overtimeMinutes > 0 ? (
                                <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.2 rounded">
                                  +{(record.overtimeMinutes / 60).toFixed(1)}h OT
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-100/70 dark:bg-zinc-800/70 border border-slate-200/60 dark:border-zinc-700/60 px-2 py-0.5 rounded-md"></span>
                          )}
                        </div>
                      </Link>
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
}
