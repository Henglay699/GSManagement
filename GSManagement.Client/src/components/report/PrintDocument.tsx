import type { ReactNode } from "react";
import logo from "../../assets/logo.png";

interface PrintDocumentProps {
  title: string;
  // Label / value pairs under the title: employee, period, etc.
  meta: [string, ReactNode][];
  // Headline figures, shown as a row of boxes.
  figures?: [string, ReactNode][];
  // One signature line per role, e.g. "Prepared by (HR)".
  signatures: string[];
  landscape?: boolean;
  // Tighter spacing so a whole month of daily rows fits on one A4 page.
  compact?: boolean;
  children: ReactNode;
}

/**
 * The printed version of a report: letterhead, details, figures, the body and
 * signature lines. Hidden on screen; styles are the `.pd-*` rules in index.css.
 */
export default function PrintDocument({
  title,
  meta,
  figures,
  signatures,
  landscape = false,
  compact = false,
  children,
}: PrintDocumentProps) {
  const generated = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`print-only pd ${landscape ? "pd-landscape" : ""} ${compact ? "pd-compact" : ""}`}>
      <div className="pd-head">
        <div className="pd-brand">
          <img src={logo} alt="" />
          <div>
            <div className="pd-company">Grateful Solutions</div>
            <div className="pd-legal">Cambodia Co., Ltd</div>
          </div>
        </div>
        <div className="pd-title">
          <h1>{title}</h1>
          <div>Generated {generated}</div>
        </div>
      </div>

      <dl className="pd-meta">
        {meta.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {figures && (
        <div className="pd-figures">
          {figures.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {children}

      <div className="pd-signatures">
        {signatures.map((role) => (
          <div key={role}>
            <div className="pd-sign-line" />
            <div className="pd-sign-role">{role}</div>
            <div className="pd-sign-hint">Name, signature &amp; date</div>
          </div>
        ))}
      </div>
    </div>
  );
}
