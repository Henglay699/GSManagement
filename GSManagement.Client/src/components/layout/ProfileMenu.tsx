import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronsUpDown, Fingerprint, LogOut, Plane, Shield, UserCog } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { paths } from "../../lib/paths";

function Avatar({ size }: { size: "sm" | "lg" }) {
  const { user } = useAuth();
  const box = size === "sm" ? "w-8 h-8 text-xs" : "w-12 h-12 text-base";
  return user?.imageUrl ? (
    <img
      src={user.imageUrl}
      alt={user.userName}
      className={`${box} rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0`}
    />
  ) : (
    <div
      className={`${box} rounded-full shrink-0 flex items-center justify-center bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold`}
    >
      {user?.userName.charAt(0).toUpperCase()}
    </div>
  );
}

// The logged-in user's name in the sidebar footer. Clicking it opens a popup
// with their details, their own attendance pages, My Profile and Log out.
export default function ProfileMenu({
  collapsed,
  onLogout,
}: {
  collapsed: boolean;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Close after navigating anywhere (e.g. via a sidebar link).
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  if (!user) return null;

  const itemClass =
    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors";

  // Every employee's own pages.
  const myPages = [
    { text: "Today", path: paths.myToday, icon: <Fingerprint size={16} /> },
    { text: "My Attendance", path: paths.myAttendance, icon: <CalendarCheck size={16} /> },
    { text: "My Leave", path: paths.myLeaves, icon: <Plane size={16} /> },
  ];
  const isHere = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Account"
        className={`w-full flex items-center py-1.5 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800/70 ${
          collapsed ? "justify-center" : "gap-2.5 px-2"
        } ${open ? "bg-slate-100 dark:bg-zinc-800/70" : ""}`}
      >
        <Avatar size="sm" />
        {!collapsed && (
          <>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">{user.userName}</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">{user.email}</span>
            </div>
            <ChevronsUpDown size={14} className="ml-auto shrink-0 text-slate-400 dark:text-zinc-500" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-64 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-2 ${
            // Above the button normally; beside it when the sidebar is collapsed.
            collapsed ? "left-full bottom-0 ml-3" : "left-0 bottom-full mb-2"
          }`}
        >
          <div className="flex items-center gap-3 p-2">
            <Avatar size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">{user.userName}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>

          {user.roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-2 pb-2">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300"
                >
                  <Shield size={11} />
                  {role}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-zinc-800 pt-1.5 space-y-0.5">
            {myPages.map((page) => (
              <button
                key={page.path}
                type="button"
                role="menuitem"
                onClick={() => navigate(page.path)}
                className={`${itemClass} ${
                  isHere(page.path)
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                {page.icon}
                {page.text}
              </button>
            ))}
          </div>

          <div className="mt-1.5 border-t border-slate-100 dark:border-zinc-800 pt-1.5 space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => navigate(paths.profile)}
              className={`${itemClass} text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800`}
            >
              <UserCog size={16} />
              My Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className={`${itemClass} text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40`}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
