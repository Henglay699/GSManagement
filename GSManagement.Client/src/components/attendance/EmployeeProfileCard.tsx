import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowUpRight,
  Loader2,
  Mail,
  Shield,
  UserRoundX,
} from "lucide-react";
import { paths } from "../../lib/paths";
import type { User } from "../../types/user";
import { getInitials } from "../../utils/string";
import ZoomablePhoto from "../ui/ZoomablePhoto";

interface EmployeeProfileCardProps {
  selected: boolean;
  loading: boolean;
  profile?: User | null;
}

// Sidebar preview of the employee picked on the Add Attendance form.
export default function EmployeeProfileCard({
  selected,
  loading,
  profile,
}: EmployeeProfileCardProps) {
  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[220px]">
        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
          <UserRoundX size={20} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
          No employee selected
        </p>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[16rem]">
          Pick someone from the Employee field and their profile will show up
          here.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 flex flex-col items-center justify-center min-h-[220px] text-slate-400 dark:text-zinc-500">
        <Loader2 size={20} className="animate-spin mb-2" />
        <span className="text-xs">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 text-center min-h-[220px] flex flex-col items-center justify-center gap-1.5">
        <AlertCircle size={18} className="text-rose-400" />
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Couldn't load this employee's profile.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="p-5 flex flex-col items-center text-center border-b border-slate-100 dark:border-zinc-800">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center text-slate-700 dark:text-zinc-200 font-bold text-base overflow-hidden">
            {profile.imageUrl ? (
              <ZoomablePhoto
                src={profile.imageUrl}
                alt={profile.userName}
                imgClassName="w-full h-full object-cover"
              />
            ) : (
              getInitials(profile.userName)
            )}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
              profile.isActive === false
                ? "bg-slate-300 dark:bg-zinc-600"
                : "bg-emerald-500"
            }`}
          />
        </div>

        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-zinc-100 truncate max-w-full">
          {profile.userName}
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-1 max-w-full">
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{profile.email}</span>
        </div>

        {profile.isActive === false && (
          <span className="mt-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-2 py-0.5 rounded-full">
            Inactive account
          </span>
        )}
      </div>

      <div className="p-5 space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          <Shield size={12} />
          Roles
        </div>

        {profile.roles && profile.roles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {profile.roles.map((role) => (
              <span
                key={role.id}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-lg text-[11px] font-semibold"
              >
                {role.roleName}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">
            No roles assigned
          </p>
        )}
      </div>

      <Link
        to={paths.userDetail(profile.id)}
        className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border-t border-slate-100 dark:border-zinc-800 transition-colors"
      >
        View full profile
        <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}
