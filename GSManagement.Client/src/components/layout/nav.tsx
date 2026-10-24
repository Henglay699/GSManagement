import { paths } from "../../lib/paths";

// Top-bar title for each page; the longest (most specific) matching prefix wins.
const TITLES: [string, string][] = [
  ["/attendance/employees/", "Employee Attendance"],
  [paths.myToday, "Today"],
  [paths.myAttendance, "My Attendance"],
  [paths.myLeaves, "My Leave"],
  [paths.dashboard, "Dashboard"],
  [paths.attendance, "Daily Attendance"],
  [paths.monthlyReport, "Monthly Report"],
  [paths.leaveRequests, "Leave Requests"],
  [paths.leaveHistory, "Leave History"],
  ["/leaves/", "Leave Request"],
  [paths.shifts, "Shifts"],
  [paths.users, "Users"],
  [paths.roles, "Roles"],
  [paths.permissions, "Permissions"],
  [paths.profile, "My Profile"],
];

/** Top-bar title for a path. */
export function titleFor(pathname: string): string {
  const match = TITLES.filter(
    ([p]) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`),
  ).sort((a, b) => b[0].length - a[0].length)[0];
  return match?.[1] ?? "Grateful Solutions";
}
