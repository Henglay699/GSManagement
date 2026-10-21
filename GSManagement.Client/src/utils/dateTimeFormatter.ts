const pad = (n: number) => String(n).padStart(2, "0");

// Formats ISO strings or Date objects as e.g. "Oct 8, 2026".
export const formatDate = (dateInput: Date | string) => {
  if (!dateInput) return "N/A";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

// "YYYY-MM-DD" from a zero-based month, without timezone shifts.
export const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

export const dateToKey = (d: Date) =>
  toDateKey(d.getFullYear(), d.getMonth(), d.getDate());

export const todayKey = () => dateToKey(new Date());

// "YYYY-MM" for a zero-based month.
export const toMonthKey = (year: number, month: number) =>
  `${year}-${pad(month + 1)}`;

const parseDateKey = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (dateKey: string, days: number) => {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  return dateToKey(d);
};

export const isSunday = (dateKey: string) => parseDateKey(dateKey).getDay() === 0;

// e.g. "Thursday, October 8"
export const formatFullDateLabel = (dateKey: string) =>
  parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

// e.g. "Thu, Oct 8"
export const formatShortDateLabel = (dateKey: string) =>
  parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const getFirstDayOfMonthString = () => {
  const d = new Date();
  return toDateKey(d.getFullYear(), d.getMonth(), 1);
};

export const getLastDayOfMonthString = () => {
  const d = new Date();
  // Day 0 of next month is the last day of this month.
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return toDateKey(d.getFullYear(), d.getMonth(), lastDay);
};
