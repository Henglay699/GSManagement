import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import ModernSideBar from "./components/layout/ModernSideBar";
import RequireAuth from "./components/auth/RequireAuth";
import RequirePermission, { NoAccess } from "./components/auth/RequirePermission";
import { useAuth } from "./context/AuthContext";
import { LeaveNotificationsProvider } from "./context/LeaveNotificationsContext";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import MyAttendancePage from "./pages/me/MyAttendancePage";
import MyAttendanceHistoryPage from "./pages/me/MyAttendanceHistoryPage";
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
import AttendancePage from "./pages/attendance/AttendancePage";
import CreateAttendancePage from "./pages/attendance/CreateAttendancePage";
import UserAttendanceDetailPage from "./pages/attendance/AttendanceDetailPage";
import ShiftPage from "./pages/shift/ShiftPage";
import LeaveRequestsPage from "./pages/leave/LeaveRequestsPage";
import LeaveHistoryPage from "./pages/leave/LeaveHistoryPage";
import LeaveDetailPage from "./pages/leave/LeaveDetailPage";
import { paths } from "./lib/paths";
import { homePages, Permission } from "./lib/permissions";

// Sidebar + content area shared by every page except login.
function AppLayout() {
  return (
    <LeaveNotificationsProvider>
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b0c0e] text-slate-900 dark:text-zinc-100 overflow-hidden">
      <ModernSideBar />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0b0c0e]">
        <Outlet />
      </main>
    </div>
    </LeaveNotificationsProvider>
  );
}

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
        <Route path={paths.myAttendance} element={<MyAttendancePage />} />
        <Route path={paths.myAttendanceHistory} element={<MyAttendanceHistoryPage />} />
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

        <Route path="/attendance" element={guard(Permission.ViewAttendance, <AttendancePage />)} />
        <Route path="/attendance/new" element={guard(Permission.CreateAttendance, <CreateAttendancePage />)} />
        <Route
          path="/attendance/users/:id"
          element={guard(Permission.ViewAttendance, <UserAttendanceDetailPage />)}
        />

        <Route path={paths.shifts} element={guard(Permission.ViewShift, <ShiftPage />)} />

        <Route path="/leaves/requests" element={guard(Permission.ViewLeave, <LeaveRequestsPage />)} />
        <Route path="/leaves/history" element={guard(Permission.ViewLeave, <LeaveHistoryPage />)} />
        <Route path="/leaves/:id" element={guard(Permission.ViewLeave, <LeaveDetailPage />)} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
