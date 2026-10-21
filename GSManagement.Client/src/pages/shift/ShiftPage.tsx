import { useCallback, useState } from "react";
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import ShiftModal from "../../components/shift/ShiftModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { Permission } from "../../lib/permissions";
import { deleteShift, fetchShifts } from "../../services/shiftService";
import type { ShiftDto } from "../../types/shift";

export default function ShiftPage() {
  const { hasPermission } = useAuth();
  const [modalState, setModalState] = useState<{
    open: boolean;
    shift: ShiftDto | null;
  }>({ open: false, shift: null });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const { data: shifts, loading, error, reload } = useAsync(
    useCallback(() => fetchShifts(), []),
    "Failed to load shifts",
  );

  async function handleDelete() {
    if (!deletingId) return;
    setBusyDelete(true);
    try {
      await deleteShift(deletingId);
      setDeletingId(null);
      reload();
    } catch {
      // Handled in dialog or reload
    } finally {
      setBusyDelete(false);
    }
  }

  function formatTime(timeStr?: string) {
    if (!timeStr) return "--:--";
    const [h, m] = timeStr.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }

  function calculateDuration(start?: string, end?: string) {
    if (!start || !end) return "";
    const [h1, m1] = start.split(":").map(Number);
    const [h2, m2] = end.split(":").map(Number);
    const diffMin = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diffMin <= 0) return "";
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hrs`;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock size={22} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
              Shift Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Configure employee shifts, working hours, grace periods, and default schedules.
          </p>
        </div>

        {hasPermission(Permission.CreateShift) && (
          <button
            onClick={() => setModalState({ open: true, shift: null })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Shift</span>
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 gap-2">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
          <span className="text-xs">Loading shifts...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold">
                  <th className="py-3.5 px-4">Shift Name</th>
                  <th className="py-3.5 px-4">Working Hours</th>
                  <th className="py-3.5 px-4">Shift Duration</th>
                  <th className="py-3.5 px-4">Late Grace Period</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 text-xs">
                {(!shifts || shifts.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                      No shifts configured yet. Click "Add Shift" to create the first one.
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr
                      key={shift.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                          <span>{shift.name}</span>
                          {shift.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <ShieldCheck size={11} />
                              Default
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-zinc-200">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-600 dark:text-zinc-300">
                          {calculateDuration(shift.startTime, shift.endTime)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          {shift.graceMinutes} minutes
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {hasPermission(Permission.UpdateShift) && (
                            <button
                              onClick={() => setModalState({ open: true, shift })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 transition-colors"
                              title="Edit Shift"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {hasPermission(Permission.DeleteShift) && (
                            <button
                              onClick={() => setDeletingId(shift.id)}
                              disabled={shift.isDefault}
                              className={`p-1.5 rounded-lg text-slate-500 transition-colors ${
                                shift.isDefault
                                  ? "opacity-30 cursor-not-allowed"
                                  : "hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                              }`}
                              title={
                                shift.isDefault
                                  ? "Cannot delete the default shift"
                                  : "Delete Shift"
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalState.open && (
        <ShiftModal
          shift={modalState.shift}
          onClose={() => setModalState({ open: false, shift: null })}
          onSaved={() => {
            setModalState({ open: false, shift: null });
            reload();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId !== null && (
        <ConfirmDialog
          title="Delete Shift"
          message="Are you sure you want to delete this shift? Existing attendance records linked to this shift will retain their historical data."
          confirmLabel="Delete"
          busyLabel="Deleting..."
          busy={busyDelete}
          onConfirm={handleDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
