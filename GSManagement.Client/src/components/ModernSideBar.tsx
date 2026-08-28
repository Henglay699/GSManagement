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
  ShieldCheck,
  UserCheck,
  Shield,
  Clock,
  Clock10Icon,
  KeyRound,
  Activity,
} from "lucide-react";

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
        {
          text: "Users",
          path: "/users",
          icon: <UserCheck size={18} />,
        },
        {
          text: "Roles",
          path: "/roles",
          icon: <Shield size={18} />,
        },
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
          path: "/attendance",
          icon: <Activity size={20} />,
        },
        {
          text: "Leave",
          path: "/leave",
          icon: <Clock10Icon size={20} />,
        },
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
      className={`relative h-screen bg-white border-r border-slate-200 flex flex-col justify-between py-4 transition-all duration-300 shrink-0 ${
        collapsed ? "w-16 px-2" : "w-65 px-3"
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
          {menuItems.map((item) => {
            // Check if item has children (dropdown)
            if (item.children) {
              const hasActiveChild = isChildActive(item.children);
              const isOpen = !!openSubmenus[item.text];
              return (
                <div key={item.text} className="space-y-1">
                  {/* Parent Button */}
                  <button
                    onClick={() => {
                      if (collapsed) setCollapsed(false);
                      toggleSubmenu(item.text);
                    }}
                    className={`w-full flex items-center py-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                      collapsed ? "justify-center px-0" : "px-3 gap-3"
                    } ${
                      hasActiveChild
                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                      <div className="absolute left-full rounded-md px-2.5 py-1.5 ml-3 bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 shadow-lg">
                        {item.text}
                      </div>
                    )}
                  </button>

                  {/* Sub-menu items */}
                  {!collapsed && isOpen && (
                    <div className="pl-6 space-y-1 border-l-2 border-slate-100 ml-4">
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

            // Standard Single Link
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
