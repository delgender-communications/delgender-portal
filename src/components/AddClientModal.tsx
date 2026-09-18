// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as clientService from "../services/clientsService";
import { ClientStatus } from "../services/clientsService";
import type { Client } from "../services/clientsService";

export default function AddClientModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (client: Client) => void;
}) {
  const [form, setForm] = useState({
    companyName: "",
    fullName: "",
    jobTitle: "",
    email: "",
    phoneNumber: "",
    industry: "",
    status: ClientStatus.Pending as ClientStatus,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (
      !form.companyName ||
      !form.fullName ||
      !form.email ||
      !form.phoneNumber ||
      !form.industry
    ) {
      setError("Fill in every field except job title, which is optional.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const client = await clientService.createClient({
        companyName: form.companyName,
        fullName: form.fullName,
        jobTitle: form.jobTitle || undefined,
        email: form.email,
        phoneNumber: form.phoneNumber,
        industry: form.industry,
        status: form.status,
      });
      onAdded(client);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't add that client.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 19 }}>Add client</h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              For clients who didn't come through the booking form.
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label>Company name</label>
          <input
            value={form.companyName}
            onChange={(e) => set("companyName", e.target.value)}
            placeholder="The client as you'd refer to them"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Contact person</label>
          <input
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Who you deal with there"
          />
        </div>

        <div className="field">
          <label>Their job title (optional)</label>
          <input
            value={form.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Phone number</label>
          <input
            value={form.phoneNumber}
            onChange={(e) => set("phoneNumber", e.target.value)}
            placeholder="10 digits"
          />
        </div>

        <div className="field">
          <label>Industry</label>
          <input
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value={ClientStatus.Pending}>Pending</option>
            <option value={ClientStatus.Working}>
              Currently working together
            </option>
            <option value={ClientStatus.Declined}>
              Declined / not working together
            </option>
          </select>
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
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding…" : "Add client"}
          </button>
        </div>
      </div>
    </div>
  );
}
