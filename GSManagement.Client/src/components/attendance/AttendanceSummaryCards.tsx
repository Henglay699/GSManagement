import { CheckCircle2, Clock, Coffee, XCircle } from "lucide-react";

interface AttendanceSummaryCardsProps {
  present: number;
  late: number;
  leave: number;
  absent: number;
  totalEmployees: number;
}

// The four daily stat cards at the top of the attendance overview.
export default function AttendanceSummaryCards({
  present,
  late,
  leave,
  absent,
  totalEmployees,
}: AttendanceSummaryCardsProps) {
  const cards = [
    {
      label: "On Time",
      value: present,
      caption: `${Math.max(0, totalEmployees - present)} People Remaining`,
      icon: CheckCircle2,
      tone: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    },
    {
      label: "Late Entry",
      value: late,
      caption: `${present} People are on Time`,
      icon: Clock,
      tone: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    },
    {
      label: "On Leave",
      value: leave,
      caption: "Approved Leave",
      icon: Coffee,
      tone: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50",
    },
    {
      label: "Absent",
      value: absent,
      caption: "Without Informing",
      icon: XCircle,
      tone: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {cards.map(({ label, value, caption, icon: Icon, tone }) => (
        <div
          key={label}
          className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1"
        >
          <div className="flex items-center gap-1.5">
            <div className={`p-1 rounded-md border ${tone}`}>
              <Icon size={13} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
              {label}
            </span>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {String(value).padStart(2, "0")}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              {caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
