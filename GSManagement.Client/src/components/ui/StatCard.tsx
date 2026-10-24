import type { ReactNode } from "react";

export type StatTone = "default" | "success" | "warning" | "danger" | "brand" | "violet" | "muted";

interface StatCardProps {
  label: string;
  value: ReactNode;
  // Small text under the value: a unit, a comparison, a breakdown.
  hint?: ReactNode;
  tone?: StatTone;
  loading?: boolean;
  // Makes the tile a filter toggle.
  onClick?: () => void;
  active?: boolean;
}

// One summary tile in the prototype's StatTiles style: small uppercase label over a bold
// value; a tone tints the tile in its status colour.
export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
  loading = false,
  onClick,
  active = false,
}: StatCardProps) {
  const toneAttr = tone === "default" || tone === "muted" ? undefined : tone;
  const body = (
    <>
      <span className="tile-label">{label}</span>
      <span className="tile-value">
        {loading ? <span className="skeleton inline-block h-6 w-14 align-middle" /> : value}
      </span>
      {hint && <span className="tile-hint">{hint}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className="tile clickable" data-tone={toneAttr} aria-pressed={active} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="tile" data-tone={toneAttr}>
      {body}
    </div>
  );
}
