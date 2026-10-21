import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarOff,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Shield,
  Clock10Icon,
  KeyRound,
  Activity,
  Sun,
  Moon,
  Bell,
  Plus,
  DollarSign,
  CalendarCheck,
  Fingerprint,
  History,
  Plane,
} from "lucide-react";

import logo from "../../assets/logo.png";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useLeaveNotifications } from "../../context/LeaveNotificationsContext";
import ConfirmDialog from "../ui/ConfirmDialog";
import ProfileMenu from "./ProfileMenu";
import { paths } from "../../lib/paths";
import { Permission } from "../../lib/permissions";

interface SubMenuItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  // Hidden unless the user has this permission; no permission = always shown.
  permission?: Permission;
}

interface MenuItem {
  text: string;
  path?: string;
  icon: React.ReactNode;
  badge?: string;
  permission?: Permission;
  children?: SubMenuItem[];
}

interface SidebarItemProps {
  icon: React.ReactNode;
  to: string;
  text: string;
  active?: boolean;
  collapsed: boolean;
  badge?: string;
}

const SidebarItem = ({
  icon,
  text,
  to,
  active,
  collapsed,
  badge,
}: SidebarItemProps) => {
  return (
    <Link to={to}>
      <div
        className={`relative flex items-center py-2 rounded-xl cursor-pointer transition-all duration-200 group ${
          collapsed ? "justify-center px-0" : "px-3 gap-3"
        } ${
          active
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none"
            : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/70 hover:text-slate-900 dark:hover:text-zinc-100"
        }`}
      >
        <div className="text-xl flex items-center justify-center shrink-0">
          {icon}
        </div>

        {!collapsed && (
          <span className="font-medium text-sm whitespace-nowrap overflow-hidden transition-all">
            {text}
          </span>
        )}

        {!collapsed && badge && (
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-200">
            {badge}
          </span>
        )}

        {collapsed && (
          <div className="absolute left-full rounded-md px-2.5 py-1.5 ml-3 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-lg">
            {text}
          </div>
        )}
      </div>
    </Link>
  );
};

export default function ModernSideBar() {
  const { theme, setTheme } = useTheme();
  const { logout, hasPermission } = useAuth();
  const { pendingCount } = useLeaveNotifications();
  const pendingBadge = pendingCount ? String(pendingCount) : undefined;
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // No need to reset state afterwards: logout always ends the session,
  // and RequireAuth then replaces this whole layout with the login page.
  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };
  // Groups the user hasn't toggled stay open while one of their pages is active.
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (text: string, currentlyOpen: boolean) => {
    setOpenSubmenus((prev) => ({ ...prev, [text]: !currentlyOpen }));
  };

  const location = useLocation();

  const allMenuItems: MenuItem[] = [
    {
      text: "Dashboard",
      path: paths.dashboard,
      icon: <LayoutDashboard size={20} />,
      permission: Permission.ViewAttendance,
    },
    // Everyone's own attendance and leave; the only menu plain employees get.
    {
      text: "My Attendance",
      icon: <Fingerprint size={20} />,
      children: [
        {
          text: "Clock In / Out",
          path: paths.myAttendance,
          icon: <Clock10Icon size={18} />,
        },
        {
          text: "My History",
          path: paths.myAttendanceHistory,
          icon: <History size={18} />,
        },
        {
          text: "My Leave",
          path: paths.myLeaves,
          icon: <Plane size={18} />,
        },
      ],
    },
    {
      text: "Analytics",
      path: "/analytics",
      icon: <BarChart2 size={20} />,
      permission: Permission.ViewAttendance,
    },
    {
      text: "User Management",
      icon: <Users size={20} />,
      children: [
        {
          text: "Users",
          path: paths.users,
          icon: <UserCheck size={18} />,
          permission: Permission.ViewUser,
        },
        {
          text: "Roles",
          path: paths.roles,
          icon: <Shield size={18} />,
          permission: Permission.ViewRole,
        },
        {
          text: "Permissions",
          path: paths.permissions,
          icon: <KeyRound size={18} />,
          permission: Permission.ViewPermission,
        },
      ],
    },
    {
      text: "Staff Attendance",
      icon: <CalendarCheck size={20} />,
      children: [
        {
          text: "Overview",
          path: paths.attendance,
          icon: <Activity size={20} />,
          permission: Permission.ViewAttendance,
        },
        {
          text: "Add Attendance",
          path: paths.attendanceCreate,
          icon: <Plus size={20} />,
          permission: Permission.CreateAttendance,
        },
        {
          text: "Shifts",
          path: paths.shifts,
          icon: <Clock10Icon size={18} />,
          permission: Permission.ViewShift,
        },
      ],
    },
    {
      text: "Leave Management",
      icon: <CalendarOff size={20} />,
      badge: pendingBadge,
      children: [
        {
          text: "Requests",
          path: paths.leaveRequests,
          icon: <Bell size={20} />,
          badge: pendingBadge,
          permission: Permission.ViewLeave,
        },
        {
          text: "Leave History",
          path: paths.leaveHistory,
          icon: <Clock10Icon size={20} />,
          permission: Permission.ViewLeave,
        },
      ],
    },
    // Placeholders for HR features that don't exist yet.
    {
      text: "Payroll",
      path: "/payroll",
      icon: <DollarSign size={20} />,
      permission: Permission.ViewAttendance,
    },
    {
      text: "Settings",
      path: "/settings",
      icon: <Settings size={20} />,
      permission: Permission.ViewAttendance,
    },
  ];

  const allowed = (item: { permission?: Permission }) =>
    !item.permission || hasPermission(item.permission);

  // Drop items the user can't open, and groups left with no children.
  const menuItems = allMenuItems
    .filter(allowed)
    .map((item) =>
      item.children
        ? { ...item, children: item.children.filter(allowed) }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);

  // "/users" is active on "/users" and on sub-pages like "/users/5/edit".
  const matches = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Among siblings, only the most specific match is active, so
  // "/attendance/new" highlights "Add Attendance" but not "Overview".
  const activeChildPath = (children: SubMenuItem[]) =>
    children
      .filter((child) => matches(child.path))
      .sort((a, b) => b.path.length - a.path.length)[0]?.path;

  return (
    <aside
      className={`relative h-screen bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col py-4 transition-all duration-300 shrink-0 ${
        collapsed ? "w-16 px-2" : "w-65 px-3"
      }`}
    >
      {/* 1. Header Section (Fixed at top) */}
      <div
        className={`flex items-center pb-4 border-b border-slate-100 dark:border-zinc-800 shrink-0 ${
          collapsed ? "justify-center flex-col gap-3" : "justify-between"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
            <img
              src={logo}
              alt="Grateful Solutions"
              className="h-full w-auto max-w-none object-cover object-left"
            />
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-800 dark:text-zinc-100 tracking-tight whitespace-nowrap leading-tight">
                Grateful Solutions
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap leading-none mt-0.5">
                Cambodia Co., Ltd
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors shrink-0"
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* 2. Scrollable Navigation Area */}
      <nav className="flex-1 overflow-y-auto min-h-0 my-3 space-y-1 pr-1 text-slate-600 dark:text-zinc-400 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        {menuItems.map((item) => {
          if (item.children) {
            const activePath = activeChildPath(item.children);
            const isOpen = openSubmenus[item.text] ?? !!activePath;
            return (
              <div key={item.text} className="space-y-1">
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    toggleSubmenu(item.text, isOpen);
                  }}
                  className={`w-full flex items-center py-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                  } ${
                    activePath
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/70 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <div className="relative text-xl flex items-center justify-center shrink-0">
                    {item.icon}
                    {collapsed && item.badge && (
                      <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-4 text-center">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <>
                      <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
                        {item.text}
                      </span>
                      {/* When open, the child item shows the count instead. */}
                      {item.badge && !isOpen && (
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        className={`${item.badge && !isOpen ? "" : "ml-auto"} transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </>
                  )}

                  {collapsed && (
                    <div className="absolute left-full rounded-md px-2.5 py-1.5 ml-3 bg-slate-900 dark:bg-zinc-800 text-white text-xs font-medium whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-lg">
                      {item.text}
                    </div>
                  )}
                </button>

                {!collapsed && isOpen && (
                  <div className="pl-6 space-y-1 border-l-2 border-slate-100 dark:border-zinc-800 ml-4">
                    {item.children.map((child) => (
                      <SidebarItem
                        key={child.text}
                        icon={child.icon}
                        text={child.text}
                        to={child.path}
                        active={child.path === activePath}
                        badge={child.badge}
                        collapsed={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <SidebarItem
              key={item.text}
              icon={item.icon}
              text={item.text}
              to={item.path!}
              badge={item.badge}
              active={matches(item.path!)}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      {/* 3. Footer Section (Fixed at bottom) */}
      <div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-3 shrink-0">
        {/* Light / Dark Theme Switcher */}
        <div className={`flex ${collapsed ? "justify-center" : "px-1"}`}>
          <div className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center gap-1 w-full text-xs font-medium">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                theme === "light"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Light Theme"
            >
              <Sun size={14} />
              {!collapsed && <span>Light</span>}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                theme === "dark"
                  ? "bg-zinc-700 text-white shadow-xs font-bold"
                  : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
              }`}
              title="Dark Theme"
            >
              <Moon size={14} />
              {!collapsed && <span>Dark</span>}
            </button>
          </div>
        </div>

        {/* User Profile Info: opens the profile popup */}
        <ProfileMenu
          collapsed={collapsed}
          onLogout={() => setShowLogoutConfirm(true)}
        />
      </div>

      {showLogoutConfirm && (
        <ConfirmDialog
          title="Log out"
          message="Are you sure you want to log out?"
          confirmLabel="Log out"
          busyLabel="Logging out..."
          busy={loggingOut}
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </aside>
  );
}
