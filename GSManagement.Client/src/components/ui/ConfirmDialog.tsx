import { ReactNode } from "react";
import {
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Destructive-action confirmation (delete user / role / leave request…).
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busyLabel = "Deleting...",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-surface rounded-2xl p-5 max-w-sm w-full shadow-xl border border-line space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 rounded-xl shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">
              {title}
            </h3>
            <p className="text-[11px] text-fg-2 mt-0.5 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-line-strong text-xs font-medium text-fg-2 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
          >
            {busy ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{busyLabel}</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
