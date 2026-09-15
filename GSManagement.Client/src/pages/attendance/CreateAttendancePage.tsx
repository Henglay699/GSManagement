/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Check,
  Mail,
  Shield,
  ArrowUpRight,
  UserRoundX,
} from "lucide-react";

export type AttendanceStatusValue = "OnTime" | "Late" | "Absent";

interface UserOption {
  id: number;
  fullName?: string;
  userName?: string;
  name?: string;
  email?: string;
}

interface EmployeeRole {
  id: number;
  roleName: string;
}

interface EmployeeProfile {
  id: number;
  userName: string;
  email: string;
  isActive?: boolean;
  imageUrl?: string;
  roles?: EmployeeRole[];
}

interface CreateAttendanceDto {
  userId: number;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: AttendanceStatusValue;
  remark?: string | null;
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function AddAttendancePage() {
  const navigate = useNavigate();

  const getTodayFormatted = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [users, setUsers] = useState<UserOption[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState<boolean>(true);

  // Searchable select state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string>("");
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [checkInTime, setCheckInTime] = useState<string>("08:00");
  const [checkOutTime, setCheckOutTime] = useState<string>("17:00");
  const [status, setStatus] = useState<AttendanceStatusValue>("OnTime");
  const [remark, setRemark] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Employee profile card state - populated once an employee is selected
  const [selectedProfile, setSelectedProfile] =
    useState<EmployeeProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Fetch users for dropdown select
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setFetchingUsers(true);
        const response = await axios.get("/api/user/select-options");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.items || response.data?.data || [];
        setUsers(data);
      } catch (err) {
        console.error("Failed to load user list:", err);
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch the full profile (image, email, roles) whenever a different employee is picked
  useEffect(() => {
    if (!userId) {
      setSelectedProfile(null);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const response = await axios.get<EmployeeProfile>(
          `/api/user/${userId}`,
        );
        if (!cancelled) setSelectedProfile(response.data);
      } catch (err) {
        console.error("Failed to load employee profile:", err);
        if (!cancelled) setSelectedProfile(null);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter users by search term
  const filteredUsers = users.filter((u) => {
    const term = userSearchTerm.toLowerCase();
    const name = (u.fullName || u.name || u.userName || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const idStr = String(u.id);
    return name.includes(term) || email.includes(term) || idStr.includes(term);
  });

  const selectedUser = users.find((u) => String(u.id) === userId);
  const selectedUserDisplayName =
    selectedUser?.fullName ||
    selectedUser?.name ||
    selectedUser?.userName ||
    (selectedUser ? `User #${selectedUser.id}` : "");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!userId) {
      setErrorMessage("Please select an employee.");
      return;
    }

    if (!date) {
      setErrorMessage("Please select a date.");
      return;
    }

    const payload: CreateAttendanceDto = {
      userId: Number(userId),
      date,
      checkInTime: status === "Absent" ? null : checkInTime || null,
      checkOutTime: status === "Absent" ? null : checkOutTime || null,
      status,
      remark: remark.trim() || null,
    };

    setLoading(true);

    try {
      await axios.post("/api/attendance", payload);
      setSuccessMessage("Attendance record created successfully.");
      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || "Failed to create attendance record.",
        );
      } else {
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const STATUS_OPTIONS = [
    {
      id: "OnTime" as const,
      label: "On Time",
      icon: CheckCircle2,
      active:
        "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400",
      iconColor: "text-emerald-500",
    },
    {
      id: "Late" as const,
      label: "Late",
      icon: Clock,
      active:
        "border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400",
      iconColor: "text-amber-500",
    },
    {
      id: "Absent" as const,
      label: "Absent",
      icon: XCircle,
      active:
        "border-rose-500/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400",
      iconColor: "text-rose-500",
    },
  ];

  return (
    <div className="max-w-[1080px] mx-auto p-4 space-y-5 text-slate-800 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
            Add Attendance Record
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            Create a manual check-in/out entry for an employee
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        {/* ================= FORM ================= */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-5"
        >
          {/* Alerts */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Employee Searchable Select & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5" ref={dropdownRef}>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Employee <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  disabled={fetchingUsers}
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-left disabled:opacity-50"
                >
                  <User
                    size={14}
                    className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none z-10"
                  />
                  <span
                    className={
                      selectedUser
                        ? "text-slate-800 dark:text-zinc-100 font-semibold truncate"
                        : "text-slate-400 dark:text-zinc-500"
                    }
                  >
                    {fetchingUsers
                      ? "Loading users..."
                      : selectedUser
                        ? selectedUserDisplayName
                        : "-- Select Employee --"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {fetchingUsers ? (
                      <Loader2
                        size={14}
                        className="animate-spin text-slate-400"
                      />
                    ) : (
                      <ChevronDown
                        size={14}
                        className="text-slate-400 dark:text-zinc-500"
                      />
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && !fetchingUsers && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-2 space-y-2 max-h-64 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="relative flex items-center shrink-0">
                      <Search
                        size={14}
                        className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
                      />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search employee by name or ID..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                      {filteredUsers.length === 0 ? (
                        <div className="p-2 text-center text-xs text-slate-400 dark:text-zinc-500">
                          No employees found
                        </div>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSelected = String(u.id) === userId;
                          const displayName =
                            u.fullName ||
                            u.name ||
                            u.userName ||
                            `User #${u.id}`;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setUserId(String(u.id));
                                setIsUserDropdownOpen(false);
                                setUserSearchTerm("");
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${
                                isSelected
                                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
                                }`}
                              >
                                {getInitials(displayName)}
                              </div>
                              <div className="truncate flex-1">
                                <div
                                  className={
                                    isSelected ? "font-semibold" : "font-medium"
                                  }
                                >
                                  {displayName}
                                </div>
                                {u.email && (
                                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                                    {u.email}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Check
                                  size={14}
                                  className="shrink-0 text-indigo-600 dark:text-indigo-400"
                                />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Calendar
                  size={14}
                  className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none"
                />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Attendance Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((item) => {
                const selected = status === item.id;
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setStatus(item.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      selected
                        ? `${item.active} ring-2 ring-indigo-500/20`
                        : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={
                        selected
                          ? item.iconColor
                          : "text-slate-400 dark:text-zinc-500"
                      }
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Times (Check In / Check Out) */}
          {status !== "Absent" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Check In Time
                </label>
                <div className="relative flex items-center">
                  <Clock
                    size={14}
                    className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none"
                  />
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Check Out Time
                </label>
                <div className="relative flex items-center">
                  <Clock
                    size={14}
                    className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none"
                  />
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remark / Notes */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Remark / Notes
            </label>
            <div className="relative flex items-start">
              <FileText
                size={14}
                className="absolute left-3 top-3 text-slate-400 dark:text-zinc-500 pointer-events-none"
              />
              <textarea
                rows={3}
                placeholder="Add optional notes or justification..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingUsers}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-2xs"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              Save Attendance
            </button>
          </div>
        </form>

        {/* ================= EMPLOYEE PROFILE CARD ================= */}
        <aside className="lg:sticky lg:top-4">
          {!userId ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-zinc-700 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[220px]">
              <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500">
                <UserRoundX size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                No employee selected
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[16rem]">
                Pick someone from the Employee field and their profile will show
                up here.
              </p>
            </div>
          ) : loadingProfile ? (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 flex flex-col items-center justify-center min-h-[220px] text-slate-400 dark:text-zinc-500">
              <Loader2 size={20} className="animate-spin mb-2" />
              <span className="text-xs">Loading profile...</span>
            </div>
          ) : selectedProfile ? (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              {/* Identity */}
              <div className="p-5 flex flex-col items-center text-center border-b border-slate-100 dark:border-zinc-800">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-sm flex items-center justify-center text-slate-700 dark:text-zinc-200 font-bold text-base overflow-hidden">
                    {selectedProfile.imageUrl ? (
                      <img
                        src={selectedProfile.imageUrl}
                        alt={selectedProfile.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(selectedProfile.userName)
                    )}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                      selectedProfile.isActive === false
                        ? "bg-slate-300 dark:bg-zinc-600"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>

                <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-zinc-100 truncate max-w-full">
                  {selectedProfile.userName}
                </h3>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 mt-1 max-w-full">
                  <Mail size={11} className="shrink-0" />
                  <span className="truncate">{selectedProfile.email}</span>
                </div>

                {selectedProfile.isActive === false && (
                  <span className="mt-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-2 py-0.5 rounded-full">
                    Inactive account
                  </span>
                )}
              </div>

              {/* Roles */}
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <Shield size={12} />
                  Roles
                </div>

                {selectedProfile.roles && selectedProfile.roles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.roles.map((role) => (
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
                to={`/user/detail/${selectedProfile.id}`}
                className="!no-underline flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border-t border-slate-100 dark:border-zinc-800 transition-colors"
              >
                View full profile
                <ArrowUpRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-6 text-center min-h-[220px] flex flex-col items-center justify-center gap-1.5">
              <AlertCircle size={18} className="text-rose-400" />
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Couldn't load this employee's profile.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AddAttendancePage;
