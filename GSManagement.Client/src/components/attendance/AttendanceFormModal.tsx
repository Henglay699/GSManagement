import { FormEvent, useState } from "react";
import { AlertCircle, Clock, FileText, Loader2, X } from "lucide-react";
import { getErrorMessage } from "../../lib/api";
import {
  createAttendance,
  updateAttendance,
} from "../../services/attendanceService";
import type {
  DayAttendanceRecord,
  ManualAttendanceStatus,
} from "../../types/attendance";
import { convert12To24 } from "../../utils/attendanceTime";
import { formatShortDateLabel } from "../../utils/dateTimeFormatter";

interface AttendanceFormModalProps {
  userId: number;
  date: string;
  // Present when editing; the record's status must not be "Leave".
  record?: DayAttendanceRecord & { id: number };
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: { id: ManualAttendanceStatus; label: string }[] = [
  { id: "OnTime", label: "On Time" },
  { id: "Late", label: "Late" },
  { id: "Absent", label: "Absent" },
];

const timeInputClass =
  "w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

export default function AttendanceFormModal({
  userId,
  date,
  record,
  onClose,
  onSaved,
}: AttendanceFormModalProps) {
  const isEdit = !!record;
  const [checkIn, setCheckIn] = useState(
    record ? convert12To24(record.checkInTime) || "08:00" : "08:00",
  );
  const [checkOut, setCheckOut] = useState(
    record ? convert12To24(record.checkOutTime) || "17:00" : "16:00",
  );
  const [status, setStatus] = useState<ManualAttendanceStatus>(
    record && record.status !== "Leave" && record.status !== "HalfDayLeave" ? record.status : "OnTime",
  );
  const [remark, setRemark] = useState(record?.remark ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      userId,
      date,
      checkInTime: status === "Absent" ? null : checkIn || null,
      checkOutTime: status === "Absent" ? null : checkOut || null,
      status,
      remark: remark.trim() || null,
    };

    try {
      if (record) await updateAttendance(record.id, payload);
      else await createAttendance(payload);
      onSaved();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          `Failed to ${isEdit ? "edit" : "create"} attendance record.`,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isEdit ? "Edit Attendance" : "Add Attendance"} -{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              {formatShortDateLabel(date)}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setStatus(item.id)}
                  className={`py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    status === item.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {status !== "Absent" && (
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["Check In", checkIn, setCheckIn],
                  ["Check Out", checkOut, setCheckOut],
                ] as const
              ).map(([label, value, setValue]) => (
                <div key={label} className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {label}
                  </label>
                  <div className="relative flex items-center">
                    <Clock
                      size={13}
                      className="absolute left-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
                    />
                    <input
                      type="time"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className={timeInputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Remark / Note
            </label>
            <div className="relative flex items-start">
              <FileText
                size={13}
                className="absolute left-2.5 top-2.5 text-slate-400 dark:text-zinc-500 pointer-events-none"
              />
              <textarea
                rows={2}
                placeholder="Optional remark..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={`${timeInputClass} placeholder:text-slate-400 resize-none`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

