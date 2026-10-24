import { DAY_STATUS, LEGEND_ORDER } from "../../lib/attendanceDisplay";

// What each colour means. Shown under calendars and boards.
export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-fg-3">
      {LEGEND_ORDER.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5" title={DAY_STATUS[s].meaning}>
          <span className={`h-2 w-2 rounded-full ${DAY_STATUS[s].dot}`} />
          {DAY_STATUS[s].label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        Flags: <span className="text-[var(--status-pending-fg)]">late / left early</span>
        <span className="text-[var(--status-exception-fg)]">missed clock-out</span>
        <span className="text-[var(--status-completed-fg)]">overtime</span>
      </span>
    </div>
  );
}
