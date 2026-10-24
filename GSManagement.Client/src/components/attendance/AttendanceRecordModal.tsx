import { useState, type FormEvent } from "react";
import {
  Loader2,
  Trash2,
} from "lucide-react";
import Modal from "../ui/Modal";
import Alert from "../ui/Alert";
import { getErrorMessage } from "../../lib/api";
import { shortDate } from "../../lib/attendanceDisplay";
import {
  createAttendance,
  deleteAttendance,
  updateAttendance,
} from "../../services/attendanceService";
import type { SummaryDay } from "../../types/attendance";

interface AttendanceRecordModalProps {
  userId: number;
  employeeName: string;
  day: SummaryDay;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * HR adds or corrects one day. HR enters what happened (times, or absent) and
 * the server works out on time / late, left early and overtime from the shift.
 */
export default function AttendanceRecordModal({
  userId,
  employeeName,
  day,
  onClose,
  onSaved,
}: AttendanceRecordModalProps) {
  const isEdit = day.attendanceId != null;
  const [mode, setMode] = useState<"worked" | "absent">(day.status === "Absent" ? "absent" : "worked");
  const [checkIn, setCheckIn] = useState(day.checkInTime?.slice(0, 5) ?? "08:00");
  const [checkOut, setCheckOut] = useState(day.checkOutTime?.slice(0, 5) ?? "");
  const [remark, setRemark] = useState(day.remark ?? "");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy("save");
    setError(null);
    const payload = {
      userId,
      date: day.date,
      checkInTime: mode === "worked" ? checkIn || null : null,
      checkOutTime: mode === "worked" ? checkOut || null : null,
      markAbsent: mode === "absent",
      remark: remark.trim() || null,
    };
    try {
      if (isEdit) await updateAttendance(day.attendanceId!, payload);
      else await createAttendance(payload);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save this day."));
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    try {
      await deleteAttendance(day.attendanceId!);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete this record."));
      setBusy(null);
    }
  }

  // Half-day leave can have its worked half corrected, but not become absent.
  const isHalfDay = day.status === "HalfDay";

  return (
    <Modal
      title={isEdit ? "Correct attendance" : "Add attendance"}
      description={`${employeeName} · ${shortDate(day.date)}`}
      onClose={onClose}
      footer={
        <>
          {isEdit && !isHalfDay && (
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              className="btn btn-ghost mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              {busy === "delete" ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" form="attendance-form" disabled={busy !== null} className="btn btn-primary">
            {busy === "save" && <Loader2 size={15} className="animate-spin" />}
            Save
          </button>
        </>
      }
    >
      <form id="attendance-form" onSubmit={save} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        {!isHalfDay && (
          <div>
            <span className="label">What happened</span>
            <div className="segmented w-full">
              <button type="button" className="flex-1" aria-pressed={mode === "worked"} onClick={() => setMode("worked")}>
                Worked
              </button>
              <button type="button" className="flex-1" aria-pressed={mode === "absent"} onClick={() => setMode("absent")}>
                Absent
              </button>
            </div>
          </div>
        )}

        {mode === "worked" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Clock in</span>
              <input type="time" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="label">Clock out</span>
              <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="input" />
            </label>
            <p className="col-span-2 -mt-1 text-xs text-fg-3">
              On time or late, leaving early and overtime are worked out from the shift.
            </p>
          </div>
        )}

        <label className="block">
          <span className="label">Note (optional)</span>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="e.g. forgot to clock out, confirmed with manager"
            className="input"
          />
        </label>
      </form>
    </Modal>
  );
}
