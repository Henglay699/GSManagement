// Every in-app URL is built here so links and <Route> paths can't drift apart.
type Id = number | string;

export const paths = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  profile: "/profile",
  dashboard: "/dashboard",

  // Self-service pages every employee gets, no permission needed.
  myToday: "/me/today",
  myAttendance: "/me/attendance",
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

  // HR: daily board, and one employee's month (month = "YYYY-MM").
  attendance: "/attendance",
  userAttendance: (id: Id, month?: string) =>
    month ? `/attendance/employees/${id}?month=${month}` : `/attendance/employees/${id}`,

  shifts: "/shifts",
  monthlyReport: "/reports/monthly",

  leaveRequests: "/leaves/requests",
  leaveHistory: "/leaves/history",
  leaveDetail: (id: Id) => `/leaves/${id}`,
};
