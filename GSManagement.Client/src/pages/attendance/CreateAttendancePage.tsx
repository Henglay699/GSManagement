import { FormEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import EmployeeProfileCard from "../../components/attendance/EmployeeProfileCard";
import UserSelect from "../../components/ui/UserSelect";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { createAttendance } from "../../services/attendanceService";
import { fetchUserById, fetchUserOptions } from "../../services/userService";
import type { ManualAttendanceStatus } from "../../types/attendance";
import { todayKey } from "../../utils/dateTimeFormatter";

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

const inputClass =
  "w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all";
const labelClass =
  "block text-xs font-semibold text-slate-700 dark:text-zinc-300";

export function CreateAttendancePage() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(todayKey);
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [status, setStatus] = useState<ManualAttendanceStatus>("OnTime");
  const [remark, setRemark] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const users = useAsync(
    useCallback(() => fetchUserOptions(), []),
    "Failed to load user list.",
  );

  // Full profile (image, roles) for the side card, refetched per selection.
  const profile = useAsync(
    useCallback(
      () => (userId ? fetchUserById(Number(userId)) : Promise.resolve(null)),
      [userId],
    ),
    "Failed to load employee profile.",
  );

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

    setSubmitting(true);
    try {
      await createAttendance({
        userId: Number(userId),
        date,
        checkInTime: status === "Absent" ? null : checkInTime || null,
        checkOutTime: status === "Absent" ? null : checkOutTime || null,
        status,
        remark: remark.trim() || null,
      });
      setSuccessMessage("Attendance record created successfully.");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setErrorMessage(
        getErrorMessage(err, "Failed to create attendance record."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1080px] mx-auto p-4 space-y-5 text-slate-800 dark:text-zinc-100">
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
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-5"
        >
          {(errorMessage || users.error) && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage ?? users.error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelClass}>
                Employee <span className="text-rose-500">*</span>
              </label>
              <UserSelect
                users={users.data ?? []}
                loading={users.loading}
                value={userId}
                onChange={setUserId}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
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
                  className={`${inputClass} cursor-pointer`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>
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

          {status !== "Absent" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {(
                [
                  ["Check In Time", checkInTime, setCheckInTime],
                  ["Check Out Time", checkOutTime, setCheckOutTime],
                ] as const
              ).map(([label, value, setValue]) => (
                <div key={label} className="space-y-1.5">
                  <label className={labelClass}>{label}</label>
                  <div className="relative flex items-center">
                    <Clock
                      size={14}
                      className="absolute left-3 text-slate-400 dark:text-zinc-500 pointer-events-none"
                    />
                    <input
                      type="time"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <label className={labelClass}>Remark / Notes</label>
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
                className={`${inputClass} placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none`}
              />
            </div>
          </div>

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
              disabled={submitting || users.loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-2xs"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Save Attendance
            </button>
          </div>
        </form>

        <aside className="lg:sticky lg:top-4">
          <EmployeeProfileCard
            selected={!!userId}
            loading={profile.loading}
            profile={profile.error ? null : profile.data}
          />
        </aside>
      </div>
    </div>
  );
}

export default CreateAttendancePage;
