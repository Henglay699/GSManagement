import type { ReactNode } from "react";

// Placeholder for an empty list or table.
export default function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-slate-300 dark:text-zinc-600">{icon}</div>}
      <div className="text-sm font-medium text-fg-2">{title}</div>
      {children && <div className="mt-1 max-w-sm text-xs text-fg-3">{children}</div>}
    </div>
  );
}
