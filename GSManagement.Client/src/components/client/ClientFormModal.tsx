import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import Alert from "../ui/Alert";
import { getErrorMessage } from "../../lib/api";
import { createClient, updateClient } from "../../services/clientService";
import type { Client, SaveClientDto } from "../../types/client";

interface Props {
  client: Client | null;
  /** Operators (no ViewAllClients): a new client is assigned to them. */
  assignsToMe: boolean;
  /** Only managers switch a client off. */
  canDeactivate: boolean;
  onClose: () => void;
  onSaved: (client: Client) => void;
}

const empty: SaveClientDto = {
  code: "",
  companyName: "",
  companyNameKm: "",
  email: "",
  vat: "",
  businessType: "Garment factory",
  address: "",
  contactName: "",
  phone: "",
  cdcNo: "",
  cdcValidUntil: "",
  notes: "",
  isActive: true,
};

// Add or edit a client (factory).
export default function ClientFormModal({ client, assignsToMe, canDeactivate, onClose, onSaved }: Props) {
  const [form, setForm] = useState<SaveClientDto>(
    client
      ? {
          code: client.code ?? "",
          companyName: client.companyName,
          companyNameKm: client.companyNameKm ?? "",
          email: client.email ?? "",
          vat: client.vat,
          businessType: client.businessType ?? "",
          address: client.address ?? "",
          contactName: client.contactName ?? "",
          phone: client.phone ?? "",
          cdcNo: client.cdcNo ?? "",
          cdcValidUntil: client.cdcValidUntil ?? "",
          notes: client.notes ?? "",
          isActive: client.isActive,
        }
      : empty,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof SaveClientDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    setSaving(true);
    setError(null);
    const body: SaveClientDto = {
      ...form,
      // Empty boxes are sent as null so the server stores nothing.
      cdcValidUntil: form.cdcValidUntil || null,
    };
    try {
      const saved = client ? await updateClient(client.id, body) : await createClient(body);
      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save the client."));
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof SaveClientDto, label: string, opts: { type?: string; placeholder?: string; span?: boolean } = {}) => (
    <div className={opts.span ? "sm:col-span-2" : undefined}>
      <label className="label" htmlFor={`cl-${key}`}>
        {label}
      </label>
      <input
        id={`cl-${key}`}
        className="input"
        type={opts.type ?? "text"}
        value={(form[key] as string) ?? ""}
        placeholder={opts.placeholder}
        onChange={set(key)}
      />
    </div>
  );

  return (
    <Modal
      title={client ? `Edit ${client.companyName}` : "Add client"}
      description={
        client
          ? "Company details used on customs letters and shipments."
          : assignsToMe
            ? "You'll be this client's operator. The Operations Manager can reassign it later."
            : "Assign an operator after saving."
      }
      onClose={onClose}
      width="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={saving || !form.companyName.trim() || !form.vat.trim()}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {client ? "Save changes" : "Add client"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("companyName", "Company name *", { span: true, placeholder: "JR APPAREL CO., LTD" })}
          {field("companyNameKm", "Company name (Khmer)", { span: true })}
          {field("code", "Short code", { placeholder: "JR" })}
          {field("vat", "VAT TIN *", { placeholder: "L001-902501613" })}
          {field("businessType", "Business type", { placeholder: "Garment factory" })}
          {field("contactName", "Contact person")}
          {field("phone", "Phone", { placeholder: "085 441 621" })}
          {field("email", "Email", { type: "email" })}
          {field("address", "Address", { span: true })}
          {field("cdcNo", "CDC master list no.", { placeholder: "QIP25021226-C01996" })}
          {field("cdcValidUntil", "CDC valid until", { type: "date" })}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="cl-notes">
              Notes
            </label>
            <textarea id="cl-notes" className="input" rows={3} value={form.notes ?? ""} onChange={set("notes")} />
          </div>
          {client && canDeactivate && (
            <label className="flex items-center gap-2 text-xs text-fg-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (inactive clients are hidden from operators)
            </label>
          )}
        </div>
      </div>
    </Modal>
  );
}
