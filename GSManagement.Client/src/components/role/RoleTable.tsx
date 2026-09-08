import { Link } from "react-router-dom";
import Role from "../../models/role";
import {
  Shield,
  KeyRound,
  Edit,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { formatDate } from "../../utils/datetimeformater";

interface RoleTableProps {
  roles: Role[];
  onDelete: (role: Role) => void;
}

function RoleTable({ roles, onDelete }: RoleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-400">
        <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-[10px] uppercase text-slate-400 dark:text-zinc-500 font-bold tracking-wider border-b border-slate-100 dark:border-zinc-800">
          <tr>
            <th scope="col" className="px-5 py-3 text-slate-600 dark:text-zinc-400">
              Role Profile
            </th>
            <th scope="col" className="px-5 py-3 text-slate-600 dark:text-zinc-400">
              Description
            </th>
            <th scope="col" className="px-5 py-3 text-slate-600 dark:text-zinc-400">
              Assigned At
            </th>
            <th scope="col" className="px-5 py-3 text-slate-600 dark:text-zinc-400">
              Assigned Permissions
            </th>
            <th scope="col" className="px-5 py-3 text-right text-slate-600 dark:text-zinc-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
          {roles?.map((role) => (
            <tr
              key={role.id}
              className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors group"
            >
              {/* Role Title & ID */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Shield size={15} />
                  </div>
                  <div>
                    <Link
                      to={`/role/detail/${role.id}`}
                      className="font-semibold text-slate-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition-colors !no-underline"
                    >
                      {role.roleName}
                    </Link>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      ID: #{role.id}
                    </div>
                  </div>
                </div>
              </td>

              {/* Description (Clean typography, removing duplicated shield icon) */}
              <td className="px-5 py-3.5 max-w-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                  <FileText size={13} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                  <span className="truncate text-xs">
                    {role.description || "No description"}
                  </span>
                </div>
              </td>

              {/* Formatted Assigned At Date */}
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-xs">
                  <Calendar size={13} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                  <span className="font-medium">
                    {formatDate(role.createdAt)}
                  </span>
                </div>
              </td>

              {/* Permission Badges */}
              <td className="px-5 py-3.5">
                <div className="flex flex-wrap gap-1 max-w-xl">
                  {role.permissions && role.permissions.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[13px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700">
                      <KeyRound size={9} className="text-slate-600 dark:text-zinc-300" />
                      {role.permissions.length}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 italic">
                      No privileges assigned
                    </span>
                  )}
                </div>
              </td>

              {/* Action Buttons */}
              <td className="px-5 py-3.5 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/role/update/${role.id}`}
                    className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Edit Role"
                  >
                    <Edit size={14} />
                  </Link>
                  <button
                    onClick={() => onDelete(role)}
                    className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 size={14} />
                  </button>
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