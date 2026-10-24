import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import RequireAuth from "./components/auth/RequireAuth";
import RequirePermission, { NoAccess } from "./components/auth/RequirePermission";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import TodayPage from "./pages/me/TodayPage";
import MyAttendancePage from "./pages/me/MyAttendancePage";
import MyLeavePage from "./pages/me/MyLeavePage";
import UserPage from "./pages/user/UserPage";
import CreateUserPage from "./pages/user/CreateUserPage";
import UserDetailPage from "./pages/user/UserDetailPage";
import UpdateUserPage from "./pages/user/UpdateUserPage";
import RolePage from "./pages/role/RolePage";
import CreateRolePage from "./pages/role/CreateRolePage";
import RoleDetailPage from "./pages/role/RoleDetailPage";
import UpdateRolePage from "./pages/role/UpdateRolePage";
import PermissionPage from "./pages/permission/PermissionPage";
import PermissionDetailPage from "./pages/permission/PermissionDetailPage";
import DailyAttendancePage from "./pages/attendance/DailyAttendancePage";
import EmployeeAttendancePage from "./pages/attendance/EmployeeAttendancePage";
import ShiftPage from "./pages/shift/ShiftPage";
import MonthlyReportPage from "./pages/report/MonthlyReportPage";
import LeaveRequestsPage from "./pages/leave/LeaveRequestsPage";
import LeaveHistoryPage from "./pages/leave/LeaveHistoryPage";
import LeaveDetailPage from "./pages/leave/LeaveDetailPage";
import { paths } from "./lib/paths";
import { homePages, Permission } from "./lib/permissions";

// "/" goes to the first page the user is allowed to open, typically Dashboard.
function HomeRedirect() {
  const { hasPermission } = useAuth();
  const home = homePages.find(
    (page) => !page.permission || hasPermission(page.permission),
  );
  return home ? <Navigate to={home.path} replace /> : <NoAccess />;
}

const guard = (permission: Permission, page: React.ReactNode) => (
  <RequirePermission permission={permission}>{page}</RequirePermission>
);

function App() {
  return (
    <Routes>
      <Route path={paths.login} element={<LoginPage />} />
      <Route path={paths.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={paths.resetPassword} element={<ResetPasswordPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />

        {/* HR dashboard: company-wide data, HR/Admin only. */}
        <Route path={paths.dashboard} element={guard(Permission.ViewAttendance, <DashboardPage />)} />

        {/* Self-service: every employee, scoped to their own data by the API. */}
        <Route path={paths.myToday} element={<TodayPage />} />
        <Route path={paths.myAttendance} element={<MyAttendancePage />} />
        <Route path={paths.myLeaves} element={<MyLeavePage />} />

        {/* Everyone can manage their own profile; no permission needed. */}
        <Route path={paths.profile} element={<ProfilePage />} />

        <Route path="/users" element={guard(Permission.ViewUser, <UserPage />)} />
        <Route path="/users/new" element={guard(Permission.CreateUser, <CreateUserPage />)} />
        <Route path="/users/:id" element={guard(Permission.ViewUser, <UserDetailPage />)} />
        <Route path="/users/:id/edit" element={guard(Permission.UpdateUser, <UpdateUserPage />)} />

        <Route path="/roles" element={guard(Permission.ViewRole, <RolePage />)} />
        <Route path="/roles/new" element={guard(Permission.CreateRole, <CreateRolePage />)} />
        <Route path="/roles/:id" element={guard(Permission.ViewRole, <RoleDetailPage />)} />
        <Route path="/roles/:id/edit" element={guard(Permission.UpdateRole, <UpdateRolePage />)} />

        <Route path="/permissions" element={guard(Permission.ViewPermission, <PermissionPage />)} />
        <Route path="/permissions/:id" element={guard(Permission.ViewPermission, <PermissionDetailPage />)} />

        <Route path={paths.attendance} element={guard(Permission.ViewAttendance, <DailyAttendancePage />)} />
        <Route
          path="/attendance/employees/:id"
          element={guard(Permission.ViewAttendance, <EmployeeAttendancePage />)}
        />

        <Route path={paths.shifts} element={guard(Permission.ViewShift, <ShiftPage />)} />
        <Route path={paths.monthlyReport} element={guard(Permission.ViewAttendance, <MonthlyReportPage />)} />

        <Route path="/leaves/requests" element={guard(Permission.ViewLeave, <LeaveRequestsPage />)} />
        <Route path="/leaves/history" element={guard(Permission.ViewLeave, <LeaveHistoryPage />)} />
        <Route path="/leaves/:id" element={guard(Permission.ViewLeave, <LeaveDetailPage />)} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
