import { Link } from "react-router-dom";
import type { Role } from "../../types/role";
import { paths } from "../../lib/paths";
import {
  Calendar,
  FileText,
  KeyRound,
  Pencil,
  Shield,
  Trash2,
} from "lucide-react";
import { formatDate } from "../../utils/dateTimeFormatter";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_ROLE, Permission } from "../../lib/permissions";

interface RoleTableProps {
  roles: Role[];
  onDelete: (role: Role) => void;
}

function RoleTable({ roles, onDelete }: RoleTableProps) {
  const { hasPermission } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-fg-2">
        <thead className="bg-slate-50/80 dark:bg-subtle text-[10px] uppercase text-fg-3 dark:text-white0 font-bold tracking-wider border-b border-line">
          <tr>
            <th scope="col" className="px-5 py-3 text-fg-2">
              Role Profile
            </th>
            <th scope="col" className="px-5 py-3 text-fg-2">
              Description
            </th>
            <th scope="col" className="px-5 py-3 text-fg-2">
              Assigned At
            </th>
            <th scope="col" className="px-5 py-3 text-fg-2">
              Assigned Permissions
            </th>
            <th scope="col" className="px-5 py-3 text-right text-fg-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-line bg-surface">
          {roles?.map((role) => (
            <tr
              key={role.id}
              className="hover:bg-slate-50/50 dark:hover:bg-zinc-800 transition-colors group"
            >
              {/* Role Title & ID */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Shield size={15} />
                  </div>
                  <div>
                    <Link
                      to={paths.roleDetail(role.id)}
                      className="font-semibold text-fg hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition-colors"
                    >
                      {role.roleName}
                    </Link>
                    <div className="text-[10px] text-fg-3 dark:text-white0 font-mono">
                      ID: #{role.id}
                    </div>
                  </div>
                </div>
              </td>

              {/* Description (Clean typography, removing duplicated shield icon) */}
              <td className="px-5 py-3.5 max-w-xs">
                <div className="flex items-center gap-1.5 text-fg-2">
                  <FileText size={13} className="text-fg-3 dark:text-white0 shrink-0" />
                  <span className="truncate text-xs">
                    {role.description || "No description"}
                  </span>
                </div>
              </td>

              {/* Formatted Assigned At Date */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-fg-2 text-xs">
                  <Calendar size={13} className="text-fg-3 dark:text-white0 shrink-0" />
                  <span className="font-medium">
                    {formatDate(role.createdAt)}
                  </span>
                </div>
              </td>

              {/* Permission Badges */}
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1 max-w-xl">
                  {role.permissions && role.permissions.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[13px] font-medium bg-slate-100 dark:bg-subtle text-fg-2 border border-slate-200/60 dark:border-line-strong">
                      <KeyRound size={9} className="text-fg-2" />
                      {role.permissions.length}
                    </span>
                  ) : (
                    <span className="text-[11px] text-fg-2 italic">
                      No privileges assigned
                    </span>
                  )}
                </div>
              </td>

              {/* Action Buttons */}
              <td className="px-5 py-3.5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1">
                  {hasPermission(Permission.UpdateRole) && (
                    <Link
                      to={paths.roleEdit(role.id)}
                      className="p-1.5 text-fg-3 dark:text-white0 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit Role"
                    >
                      <Pencil size={14} />
                    </Link>
                  )}
                  {hasPermission(Permission.DeleteRole) && role.roleName !== ADMIN_ROLE && (
                    <button
                      onClick={() => onDelete(role)}
                      className="p-1.5 text-fg-3 dark:text-white0 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RoleTable;