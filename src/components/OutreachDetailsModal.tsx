// external
import { useEffect, useState } from "react";
import { FiDownload, FiEdit2, FiMail, FiMaximize2, FiX } from "react-icons/fi";

// internal
import * as outreachService from "../services/outreachService";
import { OUTREACH_STATUSES, OutreachStatus } from "../services/outreachService";
import type { OutreachDetail } from "../services/outreachService";
import NotesExpandedModal from "./NotesExpandedModal";

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
  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState<"send" | "manual" | null>(null);
  const [acting, setActing] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  const persistNotes = async (value: string): Promise<boolean> => {
    if (!company) return false;
    setSavingNotes(true);
    setError(null);
    setNotesSaved(false);
    try {
      const updated = await outreachService.updateOutreachNotes(
        company.id,
        value,
      );
      setCompany(updated);
      setNotes(updated.notes ?? "");
      setNotesSaved(true);
      onChanged();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save those notes.",
      );
      return false;
    } finally {
      setSavingNotes(false);
    }
  };

  const saveNotes = () => persistNotes(notes);

  const openExpanded = () => {
    setError(null);
    setExpanded(true);
  };

  const closeExpanded = () => {
    setExpanded(false);
    setError(null);
  };

  const handleDownload = async () => {
    if (!company) return;
    setDownloading(true);
    setError(null);
    try {
      await outreachService.downloadPitchDeck(
        company.id,
        company.pitchDeckFileName,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't download that deck.",
      );
    } finally {
      setDownloading(false);
    }
  };

  const runEmailAction = async (kind: "send" | "manual") => {
    if (!company) return;
    setActing(true);
    setError(null);
    try {
      const updated =
        kind === "send"
          ? await outreachService.sendOutreachEmail(company.id)
          : await outreachService.markOutreachEmailed(company.id);
      setCompany(updated);
      setConfirming(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setConfirming(null);
    } finally {
      setActing(false);
    }
  };

  const canSendFromSystem = Boolean(company?.email && company?.pitchDeckUrl);

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
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                    >
                      <FiDownload size={14} />
                      {downloading
                        ? "Downloading…"
                        : company.pitchDeckFileName || "Download"}
                    </button>
                  ) : (
                    "No deck yet"
                  )}
                </div>
              </div>
            </div>

            {company.status === OutreachStatus.Ready && (
              <div className="response-block" style={{ marginBottom: 16 }}>
                <div className="detail-label" style={{ marginBottom: 8 }}>
                  Reach out
                </div>
                <p className="text-small" style={{ marginBottom: 6 }}>
                  You can email the client yourself, then mark it as sent here
                  so the rest of the team knows.
                </p>
                <p className="text-small" style={{ marginBottom: 12 }}>
                  If you don't want to handle the email yourself, click{" "}
                  <strong>Email the client</strong> and the system will send
                  everything we found to the client for you. You don't have to
                  do anything.
                </p>

                {confirming === null ? (
                  <>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => setConfirming("manual")}
                      >
                        I've emailed them myself
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => setConfirming("send")}
                        disabled={!canSendFromSystem}
                      >
                        <FiMail size={14} /> Email the client
                      </button>
                    </div>
                    {!canSendFromSystem && (
                      <div className="field-hint" style={{ marginTop: 8 }}>
                        To email from here, this company needs an email address
                        and a pitch deck. Add them with Edit.
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-small" style={{ marginBottom: 10 }}>
                      {confirming === "send"
                        ? `This will email ${company.email} with the pitch deck attached, and can't be undone. Send it?`
                        : "This marks the company as Emailed without sending anything. Use it only after you've emailed them yourself."}
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        onClick={() => setConfirming(null)}
                        disabled={acting}
                      >
                        Back
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() => runEmailAction(confirming)}
                        disabled={acting}
                      >
                        {acting
                          ? confirming === "send"
                            ? "Sending…"
                            : "Saving…"
                          : confirming === "send"
                            ? "Yes, send it"
                            : "Yes, mark as emailed"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
              <div className="notes-box">
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setNotesSaved(false);
                  }}
                  placeholder="Issues they're facing, or anything the next person should know."
                />
                <button
                  className="notes-expand"
                  type="button"
                  onClick={openExpanded}
                  aria-label="Expand notes"
                  title="Expand notes"
                >
                  <FiMaximize2 size={14} />
                </button>
              </div>
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

      {expanded && (
        <NotesExpandedModal
          subtitle={company?.companyName}
          initial={notes}
          placeholder="Issues they're facing, or anything the next person should know."
          saving={savingNotes}
          error={error}
          onDone={async (value) => {
            if (await persistNotes(value)) closeExpanded();
          }}
          onClose={closeExpanded}
        />
      )}
    </div>
  );
}
