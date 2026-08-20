import { Route, Routes } from "react-router-dom";
import UserPage from "./pages/user/UserPage";
import UpdateUserPage from "./pages/user/UpdateUserPage";
import ModernSideBar from "./components/ModernSideBar";
import CreateUserPage from "./pages/user/CreateUserPage";

function App() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Render the actual Sidebar component */}
      <ModernSideBar />

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route index element={<UserPage />} />
          <Route path="/user/create" element={<CreateUserPage />} />
          <Route path="/user/update/:id" element={<UpdateUserPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
