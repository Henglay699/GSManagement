import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";

const STYLES = {
  error: {
    box: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200",
    icon: <AlertCircle size={18} className="text-rose-500" />,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    icon: <CheckCircle2 size={18} className="text-emerald-500" />,
  },
  info: {
    box: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-100",
    icon: <Info size={18} className="text-indigo-500" />,
  },
};

export default function Alert({
  tone = "error",
  children,
}: {
  tone?: keyof typeof STYLES;
  children: ReactNode;
}) {
  const s = STYLES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] ${s.box}`}
    >
      <span className="mt-px shrink-0">{s.icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
