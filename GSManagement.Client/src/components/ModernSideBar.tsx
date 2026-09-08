import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Shield,
  Clock,
  Clock10Icon,
  KeyRound,
  Activity,
  Sun,
  Moon,
} from "lucide-react";

import logo from "../assets/logo.png";
import { useTheme } from "../hook/ThemeContex";

interface SubMenuItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

interface MenuItem {
  text: string;
  path?: string;
  icon: React.ReactNode;
  badge?: string;
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
    <Link
      to={to}
      className="!no-underline hover:!no-underline focus:!no-underline"
    >
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
  const [collapsed, setCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "User Management": false,
  });

  const toggleSubmenu = (text: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [text]: !prev[text],
    }));
  };

  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      text: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      text: "User Management",
      icon: <Users size={20} />,
      children: [
        { text: "Users", path: "/users", icon: <UserCheck size={18} /> },
        { text: "Roles", path: "/roles", icon: <Shield size={18} /> },
        {
          text: "Permissions",
          path: "/permissions",
          icon: <KeyRound size={18} />,
        },
      ],
    },
    {
      text: "Daily Attendance",
      icon: <Clock size={20} />,
      children: [
        {
          text: "Dashboard",
          path: "/attendance/dashboard",
          icon: <Activity size={20} />,
        },
        { text: "Leave", path: "/leaves", icon: <Clock10Icon size={20} /> },
      ],
    },
    { text: "Analytics", path: "/analytics", icon: <BarChart2 size={20} /> },
    { text: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  const isChildActive = (children?: SubMenuItem[]) => {
    return children?.some((child) => location.pathname === child.path);
  };

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
            const hasActiveChild = isChildActive(item.children);
            const isOpen = !!openSubmenus[item.text];
            return (
              <div key={item.text} className="space-y-1">
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false);
                    toggleSubmenu(item.text);
                  }}
                  className={`w-full flex items-center py-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                  } ${
                    hasActiveChild
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/70 hover:text-slate-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <div className="text-xl flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>

                  {!collapsed && (
                    <>
                      <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
                        {item.text}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`ml-auto transition-transform duration-200 ${
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
                        active={location.pathname === child.path}
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
              active={location.pathname === item.path}
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

        {/* User Profile Info */}
        <div
          className={`flex items-center py-1.5 ${
            collapsed ? "justify-center" : "gap-2.5 px-2"
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                Jane Doe
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                admin@gsmanagement.com
              </span>
            </div>
          )}
        </div>

        <div onClick={() => console.log("Logging out...")}>
          <SidebarItem
            icon={<LogOut size={18} className="text-rose-500" />}
            text="Logout"
            to="/logout"
            collapsed={collapsed}
          />
        </div>
      </div>
    </aside>
  );
}
