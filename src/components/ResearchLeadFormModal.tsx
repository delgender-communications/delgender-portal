// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as researchLeadService from "../services/researchLeadService";
import {
  RESEARCH_LEAD_CASES,
  ResearchLeadCase,
} from "../services/researchLeadService";

export default function ResearchLeadFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    companyName: "",
    website: "",
    industry: "",
    location: "",
    email: "",
    phoneNumber: "",
    case: ResearchLeadCase.Other as ResearchLeadCase,
    summary: "",
  });
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

    setLoading(true);
    setError(null);

    try {
      await researchLeadService.addResearchLead({
        companyName: form.companyName.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
        email: form.email.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
        case: form.case,
        summary: form.summary.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that lead.");
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
            <h2 style={{ fontSize: 19 }}>Add lead by hand</h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              A company you spotted yourself. It joins the Recommended list for
              the team to review.
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
            placeholder="Who we think we could help"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Why they caught our eye</label>
          <select
            value={form.case}
            onChange={(e) => set("case", e.target.value)}
          >
            {RESEARCH_LEAD_CASES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>What we noticed</label>
          <textarea
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="A line or two on why we could help them."
          />
        </div>

        <div className="field">
          <label>Website</label>
          <input
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="Optional. Leave empty if they don't have one."
          />
        </div>

        <div className="field">
          <label>Industry</label>
          <input
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="field">
          <label>Location</label>
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Optional"
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
            {loading ? "Adding…" : "Add lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
