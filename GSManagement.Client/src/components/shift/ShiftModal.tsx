import { FormEvent, useState } from "react";
import { AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { getErrorMessage } from "../../lib/api";
import { createShift, updateShift } from "../../services/shiftService";
import type { ShiftDto } from "../../types/shift";

interface ShiftModalProps {
  shift?: ShiftDto | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-950/50 transition-all";
const labelClass =
  "mb-1.5 block text-xs font-semibold text-slate-700 dark:text-zinc-300";

export default function ShiftModal({
  shift,
  onClose,
  onSaved,
}: ShiftModalProps) {
  const isEdit = !!shift;
  const [form, setForm] = useState({
    name: shift?.name ?? "",
    startTime: shift?.startTime?.slice(0, 5) ?? "08:00",
    endTime: shift?.endTime?.slice(0, 5) ?? "17:00",
    graceMinutes: shift?.graceMinutes ?? 15,
    isDefault: shift?.isDefault ?? false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Please provide a name for this shift.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      setError("Start time and end time are required.");
      return;
    }
    if (form.startTime >= form.endTime) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
        endTime: form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime,
        graceMinutes: Number(form.graceMinutes) || 0,
        isDefault: form.isDefault,
      };

      if (shift) {
        await updateShift(shift.id, payload);
      } else {
        await createShift(payload);
      }
      onSaved();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          isEdit ? "Failed to update shift." : "Failed to create shift.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-transparent bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {isEdit ? "Edit Shift" : "Create New Shift"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Configure working hours and late arrival grace period
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Shift Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Regular Shift, Morning Shift"
              className={inputClass}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Late Grace Period (Minutes)</label>
            <input
              type="number"
              min="0"
              max="120"
              value={form.graceMinutes}
              onChange={(e) =>
                setForm({ ...form, graceMinutes: parseInt(e.target.value, 10) || 0 })
              }
              className={inputClass}
            />
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              Employees checking in within this period after start time won't be marked late.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/40 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-zinc-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Set as Default Company Shift</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Automatically applied to all employee daily clock-in / clock-out records.
                </p>
              </div>
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isEdit
                ? submitting
                  ? "Saving..."
                  : "Save Changes"
                : submitting
                  ? "Creating..."
                  : "Create Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
