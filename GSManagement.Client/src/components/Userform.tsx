import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserFormData } from "../services/userservice";
import { fetchRoles } from "../services/roleservice";
import Role from "../models/role";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import axios from "axios";

interface UserFormProps {
  initialValues?: UserFormData;
  onSubmit: (data: UserFormData) => Promise<void>;
  isEditMode?: boolean;
}

function UserForm({
  initialValues,
  onSubmit,
  isEditMode = false,
}: UserFormProps) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState("");

  // Role Selection States
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch available roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true);
      try {
        const roles = await fetchRoles();
        setAvailableRoles(roles);
      } catch (err) {
        console.error("Failed to load roles", err);
      } finally {
        setLoadingRoles(false);
      }
    };
    loadRoles();
  }, []);

  // Pre-fill fields when initialValues change
  useEffect(() => {
    if (initialValues) {
      setUserName(initialValues.userName || "");
      setEmail(initialValues.email || "");
      setIsActive(initialValues.isActive ?? true);
      setSelectedRoleIds(initialValues.roleIds || []);
    }
  }, [initialValues]);

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        userName,
        email,
        isActive,
        roleIds: selectedRoleIds,
        ...(password.trim() ? { password } : {}),
      });
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit}>
        {/* Full Screen Main Container */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          {/* Header */}
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
                <h1 className="text-xl font-bold text-slate-800">
                  {isEditMode ? "Update User" : "Create New User"}
                </h1>
                <p className="text-xs text-slate-500">
                  {isEditMode
                    ? "Modify existing user account details and role permissions"
                    : "Fill in the details below to onboard a new user"}
                </p>
              </div>
            </div>

            {/* Action Buttons Header */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isEditMode ? "Save Changes" : "Create User"}</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm">
              {errorMessage}
            </div>
          )}

          {/* Grid Layout: Assign Roles on Left, Account Info on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: Assign Roles */}
            <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <ShieldCheck size={18} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Assign Roles
                </h2>
              </div>

              {loadingRoles ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  Loading roles...
                </div>
              ) : availableRoles.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No roles available
                </p>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  {availableRoles.map((role) => {
                    const isChecked = selectedRoleIds.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleToggle(role.id)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-medium border text-left transition-all ${
                          isChecked
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{role.roleName}</span>
                        <span className="font-bold">
                          {isChecked ? "✓" : "+"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: User Account Details */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserIcon size={18} className="text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Account Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. john_doe"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {isEditMode ? "New Password (Optional)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!isEditMode}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder={
                    isEditMode
                      ? "Leave blank to keep current password"
                      : "Enter password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="isActiveToggle"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Account Active
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UserForm;
