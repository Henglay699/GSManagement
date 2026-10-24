import type { DayStatus, SummaryDay } from "../types/attendance";

interface StatusStyle {
  label: string;
  // One-line meaning, shown in the legend and tooltips.
  meaning: string;
  // Small coloured dot.
  dot: string;
  // Pill: the prototype's .status-tag with its tone.
  chip: string;
  // Calendar cell tint.
  cell: string;
}

// Each tone uses the prototype's status colours (tokens.css), so pills follow the theme.
// Class names are written out in full so Tailwind can find them.
const TONES = {
  paid: { dot: "bg-[var(--status-paid-fg)]", chip: "status-tag paid", cell: "bg-[var(--status-paid-bg)]" },
  pending: { dot: "bg-[var(--status-pending-fg)]", chip: "status-tag pending", cell: "bg-[var(--status-pending-bg)]" },
  progress: { dot: "bg-[var(--status-progress-fg)]", chip: "status-tag progress", cell: "bg-[var(--status-progress-bg)]" },
  leave: { dot: "bg-[var(--status-leave-fg)]", chip: "status-tag leave", cell: "bg-[var(--status-leave-bg)]" },
  exception: { dot: "bg-[var(--status-exception-fg)]", chip: "status-tag exception", cell: "bg-[var(--status-exception-bg)]" },
  completed: { dot: "bg-[var(--status-completed-fg)]", chip: "status-tag completed", cell: "bg-[var(--status-completed-bg)]" },
  neutral: { dot: "bg-[var(--status-neutral-fg)]", chip: "status-tag neutral", cell: "" },
};
const tone = (name: keyof typeof TONES) => TONES[name];

/** The single source of truth for how each day status looks and what it means. */
export const DAY_STATUS: Record<DayStatus, StatusStyle> = {
  Present: { label: "Present", meaning: "Worked, arrived on time", ...tone("paid") },
  Late: { label: "Late", meaning: "Worked, arrived after the grace period", ...tone("pending") },
  HalfDay: { label: "Half day", meaning: "Approved half-day leave", ...tone("progress") },
  OnLeave: { label: "On leave", meaning: "Approved full-day leave", ...tone("leave") },
  Absent: { label: "Absent", meaning: "Working day with no clock-in and no leave", ...tone("exception") },
  InProgress: { label: "Working", meaning: "Clocked in today, not clocked out yet", ...tone("completed") },
  NotClockedIn: { label: "Not in yet", meaning: "Working day today, no clock-in yet", ...tone("neutral") },
  Holiday: {
    label: "Holiday",
    meaning: "Public holiday",
    ...tone("neutral"),
    cell: "bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,var(--bg-subtle)_6px,var(--bg-subtle)_7px)]",
  },
  DayOff: { label: "Day off", meaning: "Sunday", ...tone("neutral"), cell: "bg-[var(--bg-inset)]" },
  Upcoming: { label: "Upcoming", meaning: "Later this month", ...tone("neutral") },
  NoRecord: { label: "No record", meaning: "Past working day with nothing recorded", ...tone("neutral") },
};

/** Statuses shown in the legend, in reading order. */
export const LEGEND_ORDER: DayStatus[] = [
  "Present",
  "Late",
  "HalfDay",
  "OnLeave",
  "Absent",
  "InProgress",
  "Holiday",
  "DayOff",
];

/** "08:05:00" → "08:05"; null → "–". */
export const fmtTime = (t: string | null | undefined) => (t ? t.slice(0, 5) : "–");

/** 75 → "1h 15m", 40 → "40m", 0 → "0m". */
export function fmtMinutes(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

/** 7.25 → "7.3"; keeps whole numbers clean. */
export const fmtNumber = (n: number, digits = 1) =>
  n.toLocaleString(undefined, { maximumFractionDigits: digits });

/** Issues inside a worked day, shown as small flags next to the status. */
export interface DayFlag {
  key: string;
  label: string;
  tone: "warning" | "danger" | "info";
}

export function dayFlags(day: Pick<SummaryDay, "lateMinutes" | "earlyLeaveMinutes" | "missedClockOut" | "overtimeMinutes">): DayFlag[] {
  const flags: DayFlag[] = [];
  if (day.lateMinutes > 0)
    flags.push({ key: "late", label: `Late ${fmtMinutes(day.lateMinutes)}`, tone: "warning" });
  if (day.earlyLeaveMinutes > 0)
    flags.push({ key: "early", label: `Left ${fmtMinutes(day.earlyLeaveMinutes)} early`, tone: "warning" });
  if (day.missedClockOut)
    flags.push({ key: "missed", label: "Missed clock-out", tone: "danger" });
  if (day.overtimeMinutes > 0)
    flags.push({ key: "ot", label: `+${fmtMinutes(day.overtimeMinutes)} overtime`, tone: "info" });
  return flags;
}

export const FLAG_TONE: Record<DayFlag["tone"], string> = {
  warning: "text-[var(--status-pending-fg)]",
  danger: "text-[var(--status-exception-fg)]",
  info: "text-[var(--status-completed-fg)]",
};

export const monthLabel = (year: number, month: number) =>
  new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

/** "2026-10-23" → "Fri, 23 Oct". */
export const shortDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
