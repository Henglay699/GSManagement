// Helpers for the time-card timeline on the user attendance page.
// Times from the API are 12-hour strings like "08:12 AM".

const pad = (n: number) => String(n).padStart(2, "0");

const DAY_START_MIN = 6 * 60;
const DAY_END_MIN = 20 * 60;
export const SHIFT_START_MIN = 8 * 60;
export const SHIFT_END_MIN = 16 * 60;

export function timeToMinutes(time?: string): number | null {
  if (!time) return null;
  const match = time.trim().match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// "08:12 PM" -> "20:12" for <input type="time">.
export function convert12To24(time12?: string): string {
  const mins = timeToMinutes(time12);
  return mins == null ? "" : `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

export function percentFromMinutes(mins: number): number {
  const clamped = Math.min(Math.max(mins, DAY_START_MIN), DAY_END_MIN);
  return ((clamped - DAY_START_MIN) / (DAY_END_MIN - DAY_START_MIN)) * 100;
}

export function positionPercent(time?: string): number {
  const mins = timeToMinutes(time);
  return mins == null ? 0 : percentFromMinutes(mins);
}

function describeVariance(
  actualMinutes: number,
  scheduledMinutes: number,
  earlyWord: string,
  lateWord: string,
): string {
  const diff = actualMinutes - scheduledMinutes;
  if (Math.abs(diff) <= 5) return "right on time";
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return diff > 0 ? `${duration} ${lateWord}` : `${duration} ${earlyWord}`;
}

export function getArrivalNote(checkInTime: string): string | null {
  const mins = timeToMinutes(checkInTime);
  if (mins == null) return null;
  return `Clocked in ${describeVariance(mins, SHIFT_START_MIN, "before shift start", "after shift start")}`;
}

export function getDepartureNote(checkOutTime: string): string | null {
  const mins = timeToMinutes(checkOutTime);
  if (mins == null) return null;
  return `Clocked out ${describeVariance(mins, SHIFT_END_MIN, "before shift end", "after shift end")}`;
}
