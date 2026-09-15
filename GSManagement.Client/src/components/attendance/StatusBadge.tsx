import React from "react";
import { CheckCircle2, Clock, Coffee, XCircle, Ban } from "lucide-react";

export type AttendanceStatusValue = "OnTime" | "Late" | "Leave" | "Absent";

interface StatusBadgeProps {
  status: AttendanceStatusValue;
  totalHour?: number | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  totalHour,
}) => {
  switch (status) {
    case "OnTime":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 px-2 py-0.5 rounded-md">
          <CheckCircle2
            size={12}
            className="text-emerald-900 dark:text-emerald-400 shrink-0"
          />
          <span>{totalHour ? `${totalHour}` : "On Time"}</span>
        </span>
      );

    case "Late":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 px-2 py-0.5 rounded-md">
          <Clock
            size={12}
            className="text-amber-600 dark:text-amber-400 shrink-0"
          />
          <span>{totalHour ? `${totalHour}` : "Late"}</span>
        </span>
      );

    case "Leave":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-800 dark:text-purple-300 bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50 px-2 py-0.5 rounded-md">
          <Coffee
            size={12}
            className="text-purple-600 dark:text-purple-400 shrink-0"
          />
          <span>On Leave</span>
        </span>
      );

    case "Absent":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/50 px-2 py-0.5 rounded-md">
          <XCircle
            size={12}
            className="text-rose-600 dark:text-rose-400 shrink-0"
          />
          <span>Absent</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-zinc-500 bg-slate-100/70 dark:bg-zinc-800/70 border border-slate-200/60 dark:border-zinc-700/60 px-2 py-0.5 rounded-md">
          <Ban
            size={11}
            className="text-slate-400 dark:text-zinc-500 shrink-0"
          />
          <span>No Data</span>
        </span>
      );
  }
};

export default StatusBadge;
