import React from "react";
import { CheckCircle2, Clock, Coffee, XCircle, Ban } from "lucide-react";

// Matches GSManagement.Domain.Entities.Enums.AttendanceStatus, which the API
// now serializes as its string name (JsonStringEnumConverter in Program.cs)
// rather than the underlying int - "OnTime", not 0.
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
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 px-2 py-0.5 rounded-md">
          <CheckCircle2 size={12} className="text-emerald-900 shrink-0" />
          <span>{totalHour ? `${totalHour}` : "Present"}</span>
        </span>
      );

    case "Late":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/80 px-2 py-0.5 rounded-md">
          <Clock size={12} className="text-amber-600 shrink-0" />
          <span>{totalHour ? `${totalHour}` : "Late"}</span>
        </span>
      );

    case "Leave":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-800 bg-purple-50/90 border border-purple-200/80 px-2 py-0.5 rounded-md">
          <Coffee size={12} className="text-purple-600 shrink-0" />
          <span>Leave</span>
        </span>
      );

    case "Absent":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-50/90 border border-rose-200/80 px-2 py-0.5 rounded-md">
          <XCircle size={12} className="text-rose-600 shrink-0" />
          <span>Absent</span>
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100/70 border border-slate-200/60 px-2 py-0.5 rounded-md">
          <Ban size={11} className="text-slate-400 shrink-0" />
          <span>No Data</span>
        </span>
      );
  }
};

export default StatusBadge;
