// Every in-app URL is built here so links and <Route> paths can't drift apart.
type Id = number | string;

export const paths = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  profile: "/profile",
  dashboard: "/dashboard",

  // Self-service pages every employee gets, no permission needed.
  myAttendance: "/me/attendance",
  myAttendanceHistory: "/me/attendance/history",
  myLeaves: "/me/leaves",

  users: "/users",
  userCreate: "/users/new",
  userDetail: (id: Id) => `/users/${id}`,
  userEdit: (id: Id) => `/users/${id}/edit`,

  roles: "/roles",
  roleCreate: "/roles/new",
  roleDetail: (id: Id) => `/roles/${id}`,
  roleEdit: (id: Id) => `/roles/${id}/edit`,

  permissions: "/permissions",
  permissionDetail: (id: Id) => `/permissions/${id}`,

  attendance: "/attendance",
  attendanceCreate: "/attendance/new",
  userAttendance: (id: Id, date?: string) =>
    date ? `/attendance/users/${id}?date=${date}` : `/attendance/users/${id}`,

  shifts: "/shifts",

  leaveRequests: "/leaves/requests",
  leaveHistory: "/leaves/history",
  leaveDetail: (id: Id) => `/leaves/${id}`,
};
