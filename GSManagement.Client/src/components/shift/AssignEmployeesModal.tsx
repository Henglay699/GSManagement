import { useCallback, useMemo, useState } from "react";
import { AlertCircle, Check, Loader2, Search, Users } from "lucide-react";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage } from "../../lib/api";
import { assignShiftEmployees, fetchShiftAssignments } from "../../services/shiftService";
import type { ShiftDto } from "../../types/shift";

interface Props {
  shift: ShiftDto;
  shifts: ShiftDto[];
  onClose: () => void;
  onSaved: () => void;
}

// Picks who works a shift. Ticking someone moves them here from their current
// shift; unticking someone sends them back to the default shift. On the default
// shift nobody can be unticked: move them by assigning them another shift.
export default function AssignEmployeesModal({ shift, shifts, onClose, onSaved }: Props) {
  const { data: people, loading, error: loadError } = useAsync(
    useCallback(() => fetchShiftAssignments(), []),
    "Failed to load employees.",
  );
  const [picked, setPicked] = useState<Set<number> | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onThisShift = useMemo(
    () => new Set((people ?? []).filter((p) => p.shiftId === shift.id).map((p) => p.userId)),
    [people, shift.id],
  );
  const selected = picked ?? onThisShift;
  const shiftName = (id: number | null) => shifts.find((s) => s.id === id)?.name ?? "No shift";

  const visible = (people ?? []).filter((p) => {
    const q = query.trim().toLowerCase();
    return !q || p.userName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.roles.toLowerCase().includes(q);
  });

  const joining = [...selected].filter((id) => !onThisShift.has(id)).length;
  const leaving = [...onThisShift].filter((id) => !selected.has(id)).length;

  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await assignShiftEmployees(shift.id, [...selected]);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to assign employees."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Employees on ${shift.name}`}
      description={
        shift.isDefault
          ? "The default shift. Everyone without a shift of their own works it."
          : "Tick who works this shift. Unticked employees go back to the default shift."
      }
      onClose={onClose}
      width="lg"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-fg-3">
            {selected.size} selected
            {(joining > 0 || leaving > 0) && (
              <>
                {" · "}
                {joining > 0 && `${joining} joining`}
                {joining > 0 && leaving > 0 && ", "}
                {leaving > 0 && `${leaving} back to default`}
              </>
            )}
          </span>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading || (joining === 0 && leaving === 0)}
            className="btn btn-primary btn-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>
        </>
      }
    >
      {(error || loadError) && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error ?? loadError}</span>
        </div>
      )}

      <div className="relative mb-3">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or role"
          className="w-full rounded-xl border border-slate-200 bg-surface py-2 pl-8 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-line-strong"
          autoFocus
        />
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-line">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-fg-3">
            <Loader2 size={16} className="animate-spin" /> Loading employees...
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-10 text-xs text-fg-3">
            <Users size={18} />
            {query ? "No employee matches your search." : "There are no active employees."}
          </div>
        ) : (
          visible.map((p) => {
            const checked = selected.has(p.userId);
            // The default shift can't let people go: there's nowhere for them to go back to.
            const locked = shift.isDefault && onThisShift.has(p.userId);
            const elsewhere = p.shiftId !== shift.id;
            return (
              <label
                key={p.userId}
                className={`flex items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 dark:border-line ${
                  locked ? "cursor-default opacity-70" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                }`}
                title={locked ? "To move someone off the default shift, assign them another shift." : undefined}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={locked}
                  onChange={() => toggle(p.userId)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-zinc-600"
                />
                <Avatar name={p.userName} src={p.imageUrl} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{p.userName}</span>
                  <span className="block truncate text-[11px] text-fg-3">
                    #{p.userId}
                    {p.roles && ` · ${p.roles}`}
                  </span>
                </span>
                {elsewhere && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      checked
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                        : "bg-slate-100 text-fg-2 dark:bg-zinc-800"
                    }`}
                  >
                    {checked ? `Moves from ${shiftName(p.shiftId)}` : shiftName(p.shiftId)}
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
    </Modal>
  );
}
