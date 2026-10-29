// external
import { useState } from "react";
import { FiExternalLink, FiMaximize2, FiUpload, FiX } from "react-icons/fi";

// internal
import * as outreachService from "../services/outreachService";
import { OUTREACH_STATUSES, OutreachStatus } from "../services/outreachService";
import type { OutreachDetail } from "../services/outreachService";
import NotesExpandedModal from "./NotesExpandedModal";

const MAX_DECK_BYTES = 20 * 1024 * 1024;
const MAX_REPORT_BYTES = 20 * 1024 * 1024;
const REPORT_EXTENSIONS = [".docx", ".txt", ".pdf"];

export type OutreachFormInitial = {
  id?: number;
  companyName?: string;
  contactName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  notes?: string | null;
  status?: OutreachStatus;
  pitchDeckFileName?: string | null;
  reportFileName?: string | null;
};

function fileKind(name: string): { badge: string; kind: string; tone: string } {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return { badge: "PDF", kind: "PDF document", tone: "is-pdf" };
  }
  if (lower.endsWith(".docx")) {
    return { badge: "DOCX", kind: "DOCX document", tone: "is-docx" };
  }
  if (lower.endsWith(".txt")) {
    return { badge: "TXT", kind: "TXT document", tone: "is-txt" };
  }
  return { badge: "FILE", kind: "document", tone: "" };
}

function ReplaceFileField({
  label,
  currentName,
  chooseLabel,
  selectHint,
  loggedHint,
  accept,
  inputKey,
  selected,
  onSelected,
  onClear,
  canView,
  viewing,
  onView,
}: {
  label: string;
  currentName: string;
  chooseLabel: string;
  selectHint: string;
  loggedHint: string;
  accept: string;
  inputKey: number;
  selected: File | null;
  onSelected: (file: File | null) => void;
  onClear: () => void;
  canView: boolean;
  viewing: boolean;
  onView: () => void;
}) {
  const kind = fileKind(currentName);

  return (
    <div className="replace-file">
      <div className="replace-file-label">{label}</div>

      <div className="replace-file-current">
        <span className={`replace-file-mark ${kind.tone}`} aria-hidden>
          <span>{kind.badge}</span>
        </span>
        <div className="replace-file-meta">
          <strong title={currentName}>{currentName}</strong>
          <span>Current file - {kind.kind}</span>
        </div>
        {canView && (
          <button
            className="btn btn-ghost btn-sm replace-file-view"
            type="button"
            onClick={onView}
            disabled={viewing}
          >
            <FiExternalLink size={14} />
            {viewing ? "Opening…" : "View"}
          </button>
        )}
      </div>

      <div className="replace-file-sub">Upload a replacement (optional)</div>

      <div
        className={`replace-file-drop ${selected ? "is-selected" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onSelected(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <label>
          <FiUpload size={16} aria-hidden />
          <span className="replace-file-copy">
            <strong>{selected ? selected.name : chooseLabel}</strong>
            <span>{selectHint}</span>
          </span>
          <input
            key={inputKey}
            type="file"
            accept={accept}
            onChange={(event) => onSelected(event.target.files?.[0] ?? null)}
          />
        </label>
        {selected && (
          <button
            className="replace-file-clear"
            type="button"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>

      <p className="replace-file-note">{loggedHint}</p>
    </div>
  );
}

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
  const [reportFile, setReportFile] = useState<File | null>(null);
  // Changing a file input's key clears it, so a file that already uploaded
  // isn't shown (or sent) again if the other upload needs a retry.
  const [deckInputKey, setDeckInputKey] = useState(0);
  const [reportInputKey, setReportInputKey] = useState(0);
  const [savedId, setSavedId] = useState<number | null>(initial?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<"deck" | "report" | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const viewStoredFile = async (which: "deck" | "report", fileName: string) => {
    if (initial?.id == null) return;
    setViewing(which);
    setError(null);
    try {
      if (which === "deck") {
        await outreachService.downloadPitchDeck(initial.id, fileName);
      } else {
        await outreachService.downloadReport(initial.id, fileName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open that file.");
    } finally {
      setViewing(null);
    }
  };

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

    if (reportFile) {
      const lowerName = reportFile.name.toLowerCase();
      if (!REPORT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
        setError("The report needs to be a DOCX, TXT or PDF file.");
        return;
      }
      if (reportFile.size > MAX_REPORT_BYTES) {
        setError("That report is over 20 MB.");
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

      const uploadErrors: string[] = [];

      if (file) {
        try {
          await outreachService.uploadPitchDeck(id, file);
          setFile(null);
          setDeckInputKey((key) => key + 1);
        } catch (err) {
          uploadErrors.push(
            err instanceof Error
              ? err.message
              : "The pitch deck didn't upload.",
          );
        }
      }

      if (reportFile) {
        try {
          await outreachService.uploadReport(id, reportFile);
          setReportFile(null);
          setReportInputKey((key) => key + 1);
        } catch (err) {
          uploadErrors.push(
            err instanceof Error ? err.message : "The report didn't upload.",
          );
        }
      }

      if (uploadErrors.length > 0) {
        setError(`${uploadErrors.join(" ")} The company itself was saved.`);
        return;
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
          <div className="notes-box">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Issues they may be facing, and anything the team should know."
            />
            <button
              className="notes-expand"
              type="button"
              onClick={() => setNotesExpanded(true)}
              aria-label="Expand notes"
              title="Expand notes"
            >
              <FiMaximize2 size={14} />
            </button>
          </div>
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

        {initial?.pitchDeckFileName ? (
          <ReplaceFileField
            label="Pitch deck (PDF)"
            currentName={initial.pitchDeckFileName}
            chooseLabel="Choose a new PDF"
            selectHint="Selecting a file will replace the current pitch deck."
            loggedHint="Uploading a new PDF replaces the existing file, and the replacement is logged."
            accept="application/pdf,.pdf"
            inputKey={deckInputKey}
            selected={file}
            onSelected={setFile}
            onClear={() => {
              setFile(null);
              setDeckInputKey((key) => key + 1);
            }}
            canView={initial.id != null}
            viewing={viewing === "deck"}
            onView={() =>
              viewStoredFile("deck", initial.pitchDeckFileName as string)
            }
          />
        ) : (
          <div className="field">
            <label>Pitch deck (PDF)</label>
            <div
              className={`replace-file-drop ${file ? "is-selected" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <label>
                <FiUpload size={16} aria-hidden />
                <span className="replace-file-copy">
                  <strong>{file ? file.name : "Choose a PDF"}</strong>
                  <span>Optional. A new upload is logged.</span>
                </span>
                <input
                  key={deckInputKey}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
              {file && (
                <button
                  className="replace-file-clear"
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setDeckInputKey((key) => key + 1);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {initial?.reportFileName ? (
          <ReplaceFileField
            label="Findings report (DOCX, TXT or PDF)"
            currentName={initial.reportFileName}
            chooseLabel="Choose a new report"
            selectHint="Selecting a file will replace the current findings report."
            loggedHint="Uploading a new report replaces the existing file, and the replacement is logged."
            accept=".docx,.txt,.pdf,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            inputKey={reportInputKey}
            selected={reportFile}
            onSelected={setReportFile}
            onClear={() => {
              setReportFile(null);
              setReportInputKey((key) => key + 1);
            }}
            canView={initial.id != null}
            viewing={viewing === "report"}
            onView={() =>
              viewStoredFile("report", initial.reportFileName as string)
            }
          />
        ) : (
          <div className="field">
            <label>Findings report (DOCX, TXT or PDF)</label>
            <div
              className={`replace-file-drop ${reportFile ? "is-selected" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setReportFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <label>
                <FiUpload size={16} aria-hidden />
                <span className="replace-file-copy">
                  <strong>
                    {reportFile ? reportFile.name : "Choose a report"}
                  </strong>
                  <span>
                    Optional. The report of what we found out about this
                    company. A new upload is logged.
                  </span>
                </span>
                <input
                  key={reportInputKey}
                  type="file"
                  accept=".docx,.txt,.pdf,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) =>
                    setReportFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              {reportFile && (
                <button
                  className="replace-file-clear"
                  type="button"
                  onClick={() => {
                    setReportFile(null);
                    setReportInputKey((key) => key + 1);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

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

      {notesExpanded && (
        <NotesExpandedModal
          subtitle={form.companyName.trim() || undefined}
          initial={form.notes}
          placeholder="Issues they may be facing, and anything the team should know."
          onDone={(value) => {
            set("notes", value);
            setNotesExpanded(false);
          }}
          onClose={() => setNotesExpanded(false)}
        />
      )}
    </div>
  );
}
