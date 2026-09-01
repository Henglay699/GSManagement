import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchUsersById } from "../../services/userservice";
import { User } from "../../models/user";
import {
  ArrowLeft,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Edit,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import axios from "axios";

function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      setLoading(true);
      try {
        const foundUser = await fetchUsersById(Number(id));
        setUser(foundUser);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(
            error.response?.data?.error || "Failed to fetch user details.",
          );
        } else {
          setErrorMessage("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <span className="text-sm">Loading user details...</span>
      </div>
    );
  }

  if (errorMessage || !user) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
        <div className="text-rose-500 font-medium text-sm">
          {errorMessage || "User not found"}
        </div>
        <button
          onClick={() => navigate("/users")}
          className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">User Profile</h1>
              <p className="text-xs text-slate-500">
                Detailed account overview and assigned permissions
              </p>
            </div>
          </div>

          {/* Action Button */}
          <Link
            to={`/user/update/${user.id}`}
            className="!no-underline inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-100"
          >
            <Edit size={16} />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white text-slate-700 font-bold flex items-center justify-center text-lg tracking-wider shadow-sm">
                {getInitials(user.userName)}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  isActive ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {user.userName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Mail size={13} className="text-slate-400" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
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
          <div className="p-5 rounded-xl border border-slate-200/80 space-y-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserIcon size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Account Details
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block mb-0.5 uppercase">
                  User ID
                </span>
                <span className="font-semibold text-slate-700">
                  # {user.id}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-0.5 uppercase">
                  Username
                </span>
                <span className="font-semibold text-slate-800">
                  {user.userName}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-0.5 uppercase">
                  Email Address
                </span>
                <span className="font-semibold text-slate-800">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Roles Box */}
          <div className="p-5 rounded-xl border border-slate-200/80 space-y-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Assigned Roles
              </h3>
            </div>

            {user.roles && user.roles.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {user.roles.map((role) => (
                  <span
                    key={role.id}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-semibold"
                  >
                    {role.roleName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
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
