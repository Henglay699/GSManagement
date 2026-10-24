import { FormEvent, useState } from "react";
import type { LeaveRequestDto } from "../../types/leave";

interface RejectLeaveModalProps {
  request: LeaveRequestDto;
  onClose: () => void;
  onConfirm: (note: string) => void;
  submitting: boolean;
}

export default function RejectLeaveModal({
  request,
  onClose,
  onConfirm,
  submitting,
}: RejectLeaveModalProps) {
  const [note, setNote] = useState(request.remark || "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onConfirm(note);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-transparent bg-white p-5 shadow-xl dark:border-line dark:bg-surface">
        <h2 className="text-base font-semibold text-fg">
          Reject leave request
        </h2>
        <p className="mt-1 text-xs text-fg-2">
          Rejecting request for{" "}
          <span className="font-medium text-slate-700 dark:text-zinc-200">
            {request.userName}
          </span>{" "}
          ({request.leaveType}).
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-fg-2">
              Rejection note / reason
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-fg-3 focus:border-slate-400 dark:border-line-strong dark:bg-subtle dark:text-zinc-200 dark:placeholder:text-white0 dark:focus:border-white0"
              placeholder="State the reason for rejecting this leave request..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !note.trim()}
              className="rounded-2xl bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {submitting ? "Rejecting..." : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
