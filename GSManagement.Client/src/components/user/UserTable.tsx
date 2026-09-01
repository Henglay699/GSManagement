import { Link } from "react-router-dom";
import { User } from "../../models/user";
import { Mail, Shield, Edit, Trash2 } from "lucide-react";

interface UserTableProps {
  users: User[];
  onDelete: (user: User) => void;
}

function UserTable({ users, onDelete }: UserTableProps) {
  // Helper to extract 2-letter initials (e.g. "Iqbal Bahroin" -> "IB")
  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-100/50">
      {users?.map((user) => {
        const isActive = user.isActive !== false;

        return (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
          >
            {/* Top Bar: Status Badge & Actions */}
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-medium ${
                  isActive ? "text-emerald-600" : "text-red-400"
                }`}
              >
                {isActive ? "Active" : "In Active"}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Link
                  to={`/user/update/${user.id}`}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Edit user"
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={() => onDelete(user)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Delete user"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* User Main Info (Name, Role, Initials Avatar) */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 pr-2">
                <Link
                  to={`/user/detail/${user.id}`}
                  className="text-sm font-bold text-indigo-900 text-slate-700 hover:text-indigo-600 line-clamp-1 transition-colors"
                >
                  {user.userName}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Shield size={12} className="text-slate-800 shrink-0" />
                  <span className="line-clamp-1">
                    {user.roles && user.roles.length > 0
                      ? user.roles.map((r) => r.roleName).join(", ")
                      : "No Role"}
                  </span>
                </div>
              </div>

              {/* Avatar with Initials & Status Dot */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs tracking-wider shadow-inner">
                  {getInitials(user.userName)}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    isActive ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </div>
            </div>

            {/* Contact Details Footer */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Mail size={12} className="shrink-0 text-slate-400" />
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
