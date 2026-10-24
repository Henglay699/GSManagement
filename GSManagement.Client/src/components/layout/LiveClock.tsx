import { useEffect, useState } from "react";

const TZ = "Asia/Phnom_Penh";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Wall-clock fields in Phnom Penh, read as numbers so formatting never depends on locale data. */
function clockParts(now: Date) {
  const f = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  ) as Record<"year" | "month" | "day" | "hour" | "minute", number>;
  const weekday = new Date(Date.UTC(f.year, f.month - 1, f.day)).getUTCDay();
  const h12 = f.hour % 12 === 0 ? 12 : f.hour % 12;
  return {
    day: DAYS[weekday]!,
    date: `${String(f.day).padStart(2, "0")} ${MONTHS[f.month - 1]} ${f.year}`,
    time: `${String(h12).padStart(2, "0")}:${String(f.minute).padStart(2, "0")} ${f.hour >= 12 ? "PM" : "AM"}`,
  };
}

/** Day, date and time in Phnom Penh (UTC+7) with the Cambodian flag, as in the GS prototype. */
export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: number | undefined;
    // Tick on the minute.
    const first = window.setTimeout(() => {
      setNow(new Date());
      interval = window.setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      window.clearTimeout(first);
      if (interval) window.clearInterval(interval);
    };
  }, []);
  const p = clockParts(now);
  return (
    <div
      className="hidden items-center gap-3 border-l border-line pl-3.5 lg:flex"
      aria-label={`${p.day} ${p.date}, ${p.time} Phnom Penh time`}
    >
      <div className="text-right leading-tight">
        <div className="text-[13px] font-semibold text-fg">{p.day}</div>
        <div className="text-[11px] text-fg-3">{p.date}</div>
      </div>
      <time className="text-sm font-semibold tabular-nums text-accent" dateTime={now.toISOString()}>
        {p.time}
      </time>
      <img
        src="/khmer-flag.svg"
        alt=""
        title="Phnom Penh, Cambodia (UTC+7)"
        width={28}
        height={18}
        className="h-[18px] w-7 rounded-[3px] object-cover"
      />
    </div>
  );
}
