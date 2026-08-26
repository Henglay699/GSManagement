import { Route, Routes } from "react-router-dom";
import UserPage from "./pages/user/UserPage";
import UpdateUserPage from "./pages/user/UpdateUserPage";
import ModernSideBar from "./components/ModernSideBar";
import CreateUserPage from "./pages/user/CreateUserPage";
import RolePage from "./pages/role/RolePage";
import CreateRolePage from "./pages/role/CreateRolePage";
import UpdateRolePage from "./pages/role/UpdateRolePage";
import RoleDetailPage from "./pages/role/RoleDetailPage";
import PermissionPage from "./pages/permission/PermissionPage";
import PermissionDetailPage from "./pages/permission/PermissionDetailPage";

function App() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Render the actual Sidebar component */}
      <ModernSideBar />

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto p-3">
        <Routes>
          <Route index element={<UserPage />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/user/create" element={<CreateUserPage />} />
          <Route path="/user/update/:id" element={<UpdateUserPage />} />

          <Route path="/roles" element={<RolePage />} />
          <Route path="/role/detail/:id" element={<RoleDetailPage />} />
          <Route path="/role/create" element={<CreateRolePage />} />
          <Route path="/role/update/:id" element={<UpdateRolePage />} />

          <Route path="/permissions" element={<PermissionPage />} />
          <Route
            path="/permission/detail/:id"
            element={<PermissionDetailPage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
