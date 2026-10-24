import { useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAsync } from "../../hooks/useAsync";
import { paths } from "../../lib/paths";
import { fetchUserById } from "../../services/userService";
import { getInitials } from "../../utils/string";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Shield,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../lib/permissions";
import ZoomablePhoto from "../../components/ui/ZoomablePhoto";

function UserDetailPage() {
  const { hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const {
    data: user,
    loading,
    error: errorMessage,
  } = useAsync(
    useCallback(() => fetchUserById(userId), [userId]),
    "Failed to fetch user details.",
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-fg-2">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
        <span className="text-sm">Loading user details...</span>
      </div>
    );
  }

  if (errorMessage || !user) {
    return (
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-line text-center space-y-4">
        <div className="text-rose-500 dark:text-rose-400 font-medium text-sm">
          {errorMessage || "User not found"}
        </div>
        <button
          onClick={() => navigate(paths.users)}
          className="px-4 py-2 text-xs font-medium text-fg-2 bg-slate-100 dark:bg-subtle hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
        >
          Back to Staff List
        </button>
      </div>
    );
  }

  const isActive = user.isActive !== false;

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-6">
      {/* Header Container */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-line space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-fg-2 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                User Profile
              </h1>
              <p className="text-xs text-fg-2">
                Detailed account overview and assigned permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Action Button */}
            {hasPermission(Permission.UpdateUser) && (
              <Link
                to={paths.userEdit(user.id)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-xl transition-colors shadow-md shadow-yellow-100 dark:shadow-none"
              >
                <Pencil size={16} />
                <span>Edit Profile</span>
              </Link>
            )}
            {/* Action Button */}
            {hasPermission(Permission.ViewAttendance) && (
              <Link
                to={paths.userAttendance(user.id)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-100 dark:shadow-none"
              >
                <Calendar size={16} />
                <span>View Attendance</span>
              </Link>
            )}
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-subtle border border-slate-200/80 dark:border-line">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-zinc-700 border-2 border-white dark:border-surface text-slate-700 dark:text-zinc-200 font-bold flex items-center justify-center text-lg tracking-wider shadow-sm">
                {user.imageUrl ? (
                  <ZoomablePhoto src={user.imageUrl} alt={user.userName} />
                ) : (
                  getInitials(user.userName)
                )}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-surface ${
                  isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"
                }`}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {user.userName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-fg-2 mt-0.5">
                <Mail size={13} className="text-fg-3 dark:text-white0" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
              }`}
            >
              {isActive ? (
                <>
                  <CheckCircle2 size={13} /> Active Account
                </>
              ) : (
                <>
                  <XCircle size={13} /> Inactive
                </>
              )}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Account Details Box */}
          <div className="p-5 rounded-xl border border-slate-200/80 dark:border-line space-y-4 bg-surface shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <UserIcon
                size={18}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                Account Details
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-fg-3 dark:text-white0 font-medium block mb-0.5 uppercase">
                  User ID
                </span>
                <span className="font-semibold text-fg-2">
                  # {user.id}
                </span>
              </div>

              <div>
                <span className="text-fg-3 dark:text-white0 font-medium block mb-0.5 uppercase">
                  Username
                </span>
                <span className="font-semibold text-fg">
                  {user.userName}
                </span>
              </div>

              <div>
                <span className="text-fg-3 dark:text-white0 font-medium block mb-0.5 uppercase">
                  Email Address
                </span>
                <span className="font-semibold text-fg">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Roles Box */}
          <div className="p-5 rounded-xl border border-slate-200/80 dark:border-line space-y-4 bg-surface shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-line">
              <Shield
                size={18}
                className="text-indigo-600 dark:text-indigo-400"
              />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                Assigned Roles
              </h3>
            </div>

            {user.roles && user.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {user.roles.map((role) => (
                  <span
                    key={role.id}
                    className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 rounded-2xl text-xs font-semibold"
                  >
                    {role.roleName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-fg-3 dark:text-white0 italic">
                No roles assigned to this account.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDetailPage;
