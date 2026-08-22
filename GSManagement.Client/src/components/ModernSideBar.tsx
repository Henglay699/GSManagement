import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderPenIcon,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

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
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200">
            {badge}
          </span>
        )}

        {collapsed && (
          <div className="absolute left-full rounded-md px-2.5 py-1.5 ml-3 bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-lg">
            {text}
          </div>
        )}
      </div>
    </Link>
  );
};

export default function ModernSideBar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Users");

  const menuItems = [
    {
      text: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { text: "Users", path: "/user", icon: <Users size={20} />, badge: "12" },
    { text: "Projects", path: "/projects", icon: <FolderPenIcon size={20} /> },
    { text: "Analytics", path: "/Dashboard", icon: <BarChart2 size={20} /> },
    { text: "Settings", path: "/Dashboard", icon: <Settings size={20} /> },
  ];

  return (
    <aside
      className={`relative h-screen bg-white border-r border-slate-200 flex flex-col justify-between py-4 transition-all duration-300 shrink-0 ${
        collapsed ? "w-16 px-2" : "w-60 px-3"
      }`}
    >
      {/* Top Section */}
      <div>
        {/* Header & Logo */}
        <div
          className={`flex items-center pb-4 border-b border-slate-100 ${
            collapsed ? "justify-center flex-col gap-3" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <ShieldCheck size={20} />
            </div>
            {!collapsed && (
              <span className="font-bold text-base text-slate-800 tracking-tight whitespace-nowrap">
                GS Admin
              </span>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 space-y-1">
          {menuItems.map((item) => (
            <div key={item.text} onClick={() => setActiveItem(item.text)}>
              <SidebarItem
                icon={item.icon}
                text={item.text}
                to={item.path}
                badge={item.badge}
                active={activeItem === item.text}
                collapsed={collapsed}
              />
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="border-t border-slate-100 pt-3 space-y-1">
        <div
          className={`flex items-center py-1.5 ${
            collapsed ? "justify-center" : "gap-2.5 px-2"
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-slate-800 truncate">
                Jane Doe
              </span>
              <span className="text-[10px] text-slate-400 truncate">
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
