// external
import { useEffect, useState } from "react";
import { FiDownload, FiEdit2, FiX } from "react-icons/fi";

// internal
import * as outreachService from "../services/outreachService";
import { OUTREACH_STATUSES } from "../services/outreachService";
import type { OutreachDetail } from "../services/outreachService";

function formatLogTime(value: string): string {
  return new Date(value).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OutreachDetailsModal({
  id,
  onClose,
  onEdit,
  onChanged,
}: {
  id: number;
  onClose: () => void;
  onEdit: (company: OutreachDetail) => void;
  onChanged: () => void;
}) {
  const [company, setCompany] = useState<OutreachDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    outreachService
      .getOutreachById(id)
      .then((detail) => {
        if (!active) return;
        setCompany(detail);
        setNotes(detail.notes ?? "");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Couldn't open that company.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const statusMeta = OUTREACH_STATUSES.find(
    (status) => status.value === company?.status,
  );

  const saveNotes = async () => {
    if (!company) return;
    setSavingNotes(true);
    setError(null);
    setNotesSaved(false);
    try {
      const updated = await outreachService.updateOutreachNotes(
        company.id,
        notes,
      );
      setCompany(updated);
      setNotes(updated.notes ?? "");
      setNotesSaved(true);
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save those notes.",
      );
    } finally {
      setSavingNotes(false);
    }
  };

  const notesDirty = (company?.notes ?? "") !== notes;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 19 }}>
              {company?.companyName ?? "Company"}
            </h2>
            {company && (
              <p className="text-muted text-small" style={{ marginTop: 4 }}>
                Added by {company.addedByName} ·{" "}
                {formatLogTime(company.createdAt)}
              </p>
            )}
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {loading || !company ? (
          <p className="text-muted">{loading ? "Loading…" : "Not found."}</p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <span className={`badge ${statusMeta?.badge ?? "badge-draft"}`}>
                {statusMeta?.label ?? company.status}
              </span>
              <p className="text-muted text-small" style={{ marginTop: 8 }}>
                {statusMeta?.description}
              </p>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <div className="detail-label">Contact</div>
                <div className="detail-value">{company.contactName || "—"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{company.email || "—"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Phone</div>
                <div className="detail-value">{company.phoneNumber || "—"}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Pitch deck</div>
                <div className="detail-value">
                  {company.pitchDeckUrl ? (
                    <a
                      className="btn btn-ghost btn-sm"
                      href={company.pitchDeckUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FiDownload size={14} />
                      {company.pitchDeckFileName || "Download"}
                    </a>
                  ) : (
                    "No deck yet"
                  )}
                </div>
              </div>
            </div>

            <div className="field">
              <label>What each status means</label>
              <ul className="status-legend" style={{ marginBottom: 0 }}>
                {OUTREACH_STATUSES.map((status) => (
                  <li key={status.value}>
                    <span className={`badge ${status.badge}`}>
                      {status.label}
                    </span>
                    <span>{status.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesSaved(false);
                }}
                placeholder="Issues they're facing, or anything the next person should know."
              />
              <div className="field-hint">
                Notes can be edited by anyone and are not added to the activity
                log.
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={saveNotes}
                  disabled={savingNotes || !notesDirty}
                >
                  {savingNotes ? "Saving…" : "Save notes"}
                </button>
                {notesSaved && !notesDirty && (
                  <span className="text-muted text-small">Saved</span>
                )}
              </div>
            </div>

            <div className="response-block">
              <div className="detail-label" style={{ marginBottom: 12 }}>
                Activity
              </div>
              {company.logs.length === 0 ? (
                <p className="text-muted text-small">No activity yet.</p>
              ) : (
                <ul className="outreach-log">
                  {company.logs.map((log) => (
                    <li key={log.id}>
                      <div className="outreach-log-msg">
                        <strong>{log.actorName}</strong> {log.message}
                      </div>
                      <div className="text-muted text-small">
                        {formatLogTime(log.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => onEdit(company)}
              >
                <FiEdit2 size={14} /> Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
