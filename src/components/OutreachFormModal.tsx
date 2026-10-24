// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as outreachService from "../services/outreachService";
import { OUTREACH_STATUSES, OutreachStatus } from "../services/outreachService";
import type { OutreachDetail } from "../services/outreachService";

const MAX_DECK_BYTES = 20 * 1024 * 1024;

export type OutreachFormInitial = {
  id?: number;
  companyName?: string;
  contactName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  notes?: string | null;
  status?: OutreachStatus;
  pitchDeckFileName?: string | null;
};

export default function OutreachFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: OutreachFormInitial | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState({
    companyName: initial?.companyName ?? "",
    contactName: initial?.contactName ?? "",
    email: initial?.email ?? "",
    phoneNumber: initial?.phoneNumber ?? "",
    notes: initial?.notes ?? "",
    status: initial?.status ?? OutreachStatus.Researching,
  });
  const [file, setFile] = useState<File | null>(null);
  const [savedId, setSavedId] = useState<number | null>(initial?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    if (!form.companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError("That email doesn't look right.");
      return;
    }

    if (file) {
      const looksLikePdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      if (!looksLikePdf) {
        setError("The pitch deck needs to be a PDF.");
        return;
      }
      if (file.size > MAX_DECK_BYTES) {
        setError("That PDF is over 20 MB.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim() || null,
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };

    try {
      let id = savedId;
      let detail: OutreachDetail;

      if (id == null) {
        detail = await outreachService.createOutreach(payload);
        id = detail.id;
        setSavedId(id);
      } else {
        detail = await outreachService.updateOutreach(id, payload);
      }

      if (file) {
        try {
          await outreachService.uploadPitchDeck(id, file);
        } catch (err) {
          setError(
            err instanceof Error
              ? `${err.message} The company itself was saved.`
              : "The company was saved, but the pitch deck didn't upload.",
          );
          return;
        }
      }

      void detail;
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save that company.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 19 }}>
              {isEdit ? "Update company" : "Add company"}
            </h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              {isEdit
                ? "Anything here can be changed. Notes are not written to the activity log."
                : "Record a company we want to work with. You can set any status now."}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label>Company name</label>
          <input
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="Who we're reaching out to"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Contact</label>
          <input
            value={form.contactName}
            onChange={(e) => set("contactName", e.target.value)}
            placeholder="Person we would email, if we have a name, otherwise leave blank"
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="field">
          <label>Phone number</label>
          <input
            value={form.phoneNumber}
            onChange={(e) => set("phoneNumber", e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Issues they may be facing, and anything the team should know."
          />
          <div className="field-hint">
            Anyone can edit notes later. Those edits are not logged.
          </div>
        </div>

        <div className="field">
          <label>Status</label>
          <div className="status-options">
            {OUTREACH_STATUSES.map((status) => (
              <button
                key={status.value}
                type="button"
                className={`status-option ${form.status === status.value ? "active" : ""}`}
                onClick={() => set("status", status.value)}
              >
                <div>
                  <strong>{status.label}</strong>
                  <span>{status.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Pitch deck (PDF)</label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="field-hint">
            {initial?.pitchDeckFileName
              ? `Current file: ${initial.pitchDeckFileName}. Uploading a new PDF replaces it, and that replacement is logged.`
              : "Optional. A new upload is logged."}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
            type="button"
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? "Saving…" : isEdit ? "Save changes" : "Add company"}
          </button>
        </div>
      </div>
    </div>
  );
}
