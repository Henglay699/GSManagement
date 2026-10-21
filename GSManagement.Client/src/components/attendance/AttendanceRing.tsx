// Circular percentage gauge shown next to the employee's name.
export default function AttendanceRing({ percent }: { percent: number | null }) {
  const size = 46;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((percent ?? 0) / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-zinc-800"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-indigo-600 dark:stroke-indigo-400 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold font-mono text-slate-800 dark:text-zinc-100">
          {percent == null ? "—" : `${percent}%`}
        </span>
      </div>
    </div>
  );
}
