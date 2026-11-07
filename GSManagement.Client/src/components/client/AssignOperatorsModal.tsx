import { useState } from "react";
import { Crown, Loader2, UserPlus } from "lucide-react";
import Modal from "../ui/Modal";
import Alert from "../ui/Alert";
import Avatar from "../ui/Avatar";
import { getErrorMessage } from "../../lib/api";
import { assignClientOperators } from "../../services/clientService";
import type { Client, OperatorOption } from "../../types/client";

interface Props {
  client: Client;
  operators: OperatorOption[];
  onClose: () => void;
  onSaved: (client: Client) => void;
}

type Pick = "primary" | "backup" | "none";

// The Operations Manager decides who handles a client: one primary operator (owns the
// client's shipments) and backups who cover when the primary is away.
export default function AssignOperatorsModal({ client, operators, onClose, onSaved }: Props) {
  const [picks, setPicks] = useState<Record<number, Pick>>(() =>
    Object.fromEntries(client.operators.map((o) => [o.userId, o.isPrimary ? "primary" : "backup"])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = (id: number): Pick => picks[id] ?? "none";
  const setPick = (id: number, value: Pick) =>
    setPicks((prev) => {
      const next = { ...prev };
      // Only one primary: the previous primary becomes a backup.
      if (value === "primary")
        for (const [k, v] of Object.entries(next)) if (v === "primary") next[Number(k)] = "backup";
      next[id] = value;
      return next;
    });

  const primary = Object.entries(picks).find(([, v]) => v === "primary")?.[0];
  const backups = Object.entries(picks)
    .filter(([, v]) => v === "backup")
    .map(([k]) => Number(k));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      onSaved(await assignClientOperators(client.id, primary ? Number(primary) : null, backups));
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the assignment."));
    } finally {
      setSaving(false);
    }
  }

  // Least busy first, so work is spread evenly.
  const sorted = [...operators].sort(
    (a, b) => a.primaryCount - b.primaryCount || a.userName.localeCompare(b.userName),
  );

  return (
    <Modal
      title={`Who handles ${client.companyName}?`}
      description="The primary operator owns this client's shipments. Backups cover leave and busy weeks."
      onClose={onClose}
      width="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save assignment
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <Alert>{error}</Alert>}
        {!primary && (
          <Alert tone="info">Pick a primary operator so the client's shipments have an owner.</Alert>
        )}
        {operators.length === 0 ? (
          <p className="text-xs text-fg-3">
            Nobody can be assigned yet. Give a role the "UpdateClient" permission (e.g. Operation) first.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {sorted.map((o) => {
              const p = pick(o.id);
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <Avatar name={o.userName} src={o.imageUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{o.userName}</div>
                    <div className="truncate text-[11px] text-fg-3">
                      {o.roles || "No role"} · {o.primaryCount} primary · {o.backupCount} backup
                    </div>
                  </div>
                  <div className="segmented" role="group" aria-label={`${o.userName}'s part`}>
                    <button type="button" aria-pressed={p === "primary"} onClick={() => setPick(o.id, "primary")}>
                      <Crown size={12} className="mr-1 inline" />
                      Primary
                    </button>
                    <button type="button" aria-pressed={p === "backup"} onClick={() => setPick(o.id, "backup")}>
                      <UserPlus size={12} className="mr-1 inline" />
                      Backup
                    </button>
                    <button type="button" aria-pressed={p === "none"} onClick={() => setPick(o.id, "none")}>
                      None
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
