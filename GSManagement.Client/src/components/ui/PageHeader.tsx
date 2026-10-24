import type { ReactNode } from "react";

interface PageHeaderProps {
  // Shown in the top bar already; only rendered here when `showTitle` is set
  // (e.g. an employee's name on their page).
  title: string;
  showTitle?: boolean;
  description?: ReactNode;
  // Kept for older callers; not shown (the top bar names the section).
  eyebrow?: string;
  // Buttons, filters, etc. on the right; hidden when printing.
  actions?: ReactNode;
}

// The row under the top bar: context on the left, page actions on the right.
export default function PageHeader({ title, showTitle = false, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {showTitle && (
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">{title}</h2>
        )}
        {description && (
          <div className={`text-[13px] text-fg-3 ${showTitle ? "mt-1" : ""}`}>{description}</div>
        )}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
