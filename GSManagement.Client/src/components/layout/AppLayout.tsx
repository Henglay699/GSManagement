import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LeaveNotificationsProvider } from "../../context/LeaveNotificationsContext";
import ModernSideBar from "./ModernSideBar";
import TopBar from "./TopBar";
import { titleFor } from "./nav";

// Sidebar + top control bar + content area, shared by every page except login.
export default function AppLayout() {
  const location = useLocation();
  const title = titleFor(location.pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = `${title} | Grateful Solutions`;
  }, [title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <LeaveNotificationsProvider>
      <div className="app-shell flex h-screen w-full bg-slate-50 dark:bg-[#0b0c0e] text-slate-900 dark:text-zinc-100 overflow-hidden">
        <ModernSideBar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
        <div className="app-shell flex h-screen min-w-0 flex-1 flex-col">
          <TopBar title={title} onToggleMenu={() => setMobileOpen((o) => !o)} />
          <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0b0c0e]">
            <Outlet />
          </main>
        </div>
      </div>
    </LeaveNotificationsProvider>
  );
}
