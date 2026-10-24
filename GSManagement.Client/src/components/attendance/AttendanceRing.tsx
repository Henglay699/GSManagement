// Circular percentage gauge: small next to an employee's name, large as the
// headline on the monthly report.
export default function AttendanceRing({
  percent,
  size = "sm",
}: {
  percent: number | null;
  size?: "sm" | "lg";
}) {
  const px = size === "lg" ? 120 : 46;
  const stroke = size === "lg" ? 10 : 5;
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, percent ?? 0) / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <svg width={px} height={px} className="-rotate-90">
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-zinc-800"
          fill="none"
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-indigo-600 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500 dark:stroke-indigo-400"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`font-mono font-bold text-slate-800 dark:text-zinc-100 ${size === "lg" ? "text-2xl" : "text-[11px]"}`}
        >
          {percent == null ? "—" : `${Math.round(percent)}%`}
        </span>
      </div>
    </div>
  );
}
