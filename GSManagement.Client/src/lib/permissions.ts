import { paths } from "./paths";

// The system admin role (Role.AdminRoleName on the backend). The server refuses
// to delete or rename it, or to delete users who hold it.
export const ADMIN_ROLE = "Admin";

// Must match the AppPermission enum names on the backend
// (GSManagement.Domain/Entities/Enums/AppPermission.cs).
export const Permission = {
  ViewUser: "ViewUser",
  CreateUser: "CreateUser",
  UpdateUser: "UpdateUser",
  DeleteUser: "DeleteUser",

  ViewRole: "ViewRole",
  CreateRole: "CreateRole",
  UpdateRole: "UpdateRole",
  DeleteRole: "DeleteRole",

  ViewPermission: "ViewPermission",

  ViewAttendance: "ViewAttendance",
  CreateAttendance: "CreateAttendance",
  UpdateAttendance: "UpdateAttendance",

  ViewLeave: "ViewLeave",
  CreateLeave: "CreateLeave",
  UpdateLeave: "UpdateLeave",
  DeleteLeave: "DeleteLeave",

  ViewShift: "ViewShift",
  CreateShift: "CreateShift",
  UpdateShift: "UpdateShift",
  DeleteShift: "DeleteShift",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// Landing pages in order of preference; "/" sends the user to the first one
// they're allowed to open. HR/Admin land on the HR dashboard; everyone else
// lands on their own clock-in page.
export const homePages: { path: string; permission?: Permission }[] = [
  { path: paths.dashboard, permission: Permission.ViewAttendance },
  { path: paths.myToday },
  { path: paths.users, permission: Permission.ViewUser },
  { path: paths.attendance, permission: Permission.ViewAttendance },
  { path: paths.leaveRequests, permission: Permission.ViewLeave },
  { path: paths.roles, permission: Permission.ViewRole },
  { path: paths.permissions, permission: Permission.ViewPermission },
  { path: paths.shifts, permission: Permission.ViewShift },
];
