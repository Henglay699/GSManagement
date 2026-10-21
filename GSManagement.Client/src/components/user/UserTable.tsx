import { Link } from "react-router-dom";
import type { User } from "../../types/user";
import { paths } from "../../lib/paths";
import { getInitials } from "../../utils/string";
import { Mail, Shield, Edit, Trash2, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";
import ZoomablePhoto from "../ui/ZoomablePhoto";

interface UserTableProps {
  users: User[];
  onDelete: (user: User) => void;
}

function UserTable({ users, onDelete }: UserTableProps) {
  const { hasPermission } = useAuth();

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-100/50 dark:bg-zinc-900">
      {users?.map((user) => {
        const isActive = user.isActive !== false;

        return (
          <div
            key={user.id}
            className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200/80 dark:border-zinc-700 p-4 shadow-sm hover:shadow-md dark:shadow-none transition-all flex flex-col justify-between space-y-3 relative group"
          >
            {/* Top Bar: Status Badge & Actions */}
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-medium ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-400 dark:text-rose-400"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {hasPermission(Permission.UpdateUser) && (
                  <Link
                    to={paths.userEdit(user.id)}
                    className="p-1 text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                    title="Edit user"
                  >
                    <Edit size={14} />
                  </Link>
                )}
                {hasPermission(Permission.ViewAttendance) && (
                  <Link
                    to={paths.userAttendance(user.id)}
                    className="p-1 text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                    title="View attendance"
                  >
                    <Calendar size={14} />
                  </Link>
                )}
                {hasPermission(Permission.DeleteUser) && (
                  <button
                    onClick={() => onDelete(user)}
                    className="p-1 text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                    title="Delete user"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* User Main Info (Name, Role, Initials Avatar) */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 pr-2">
                <Link
                  to={paths.userDetail(user.id)}
                  className="text-sm font-bold text-slate-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-1 transition-colors"
                >
                  {user.userName}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                  <Shield
                    size={12}
                    className="text-slate-800 dark:text-zinc-300 shrink-0"
                  />
                  <span className="line-clamp-1">
                    {user.roles && user.roles.length > 0
                      ? user.roles.map((r) => r.roleName).join(", ")
                      : "No Role"}
                  </span>
                </div>
              </div>

              {/* Avatar with Initials & Status Dot */}
              <div className="relative shrink-0">
                <div className="w-13 h-13 rounded-full bg-slate-100 dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center text-xs tracking-wider shadow-inner">
                  {user.imageUrl ? (
                    <ZoomablePhoto src={user.imageUrl} alt={user.userName} />
                  ) : (
                    getInitials(user.userName)
                  )}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-800 ${
                    isActive
                      ? "bg-emerald-500"
                      : "bg-slate-300 dark:bg-zinc-600"
                  }`}
                />
              </div>
            </div>

            {/* Contact Details Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-700 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                <Mail
                  size={12}
                  className="shrink-0 text-slate-400 dark:text-zinc-500"
                />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UserTable;
