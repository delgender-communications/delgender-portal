// external
import { FiDownload, FiFile, FiUpload } from "react-icons/fi";

// internal
import type { OutreachDetail } from "../../services/outreachService";
import { formatDate } from "../../utils/format";
import { fileKind } from "../../utils/outreachHelpers";

export type FileKey = "deck" | "report";

const REPORT_ACCEPT =
  ".docx,.txt,.pdf,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function FileSlot({
  title,
  stored,
  emptyTitle,
  emptyHint,
  editing,
  selected,
  onSelected,
  inputKey,
  accept,
  chooseLabel,
  replaceHint,
  addHint,
  onDownload,
  downloading,
}: {
  title: string;
  stored: { name: string; uploadedAt?: string | null } | null;
  emptyTitle: string;
  emptyHint: string;
  editing: boolean;
  selected: File | null;
  onSelected: (file: File | null) => void;
  inputKey: number;
  accept: string;
  chooseLabel: string;
  replaceHint: string;
  addHint: string;
  onDownload: () => void;
  downloading: boolean;
}) {
  const kind = stored ? fileKind(stored.name) : null;

  return (
    <div className="oc-file-slot">
      <div className="detail-label">{title}</div>

      {stored && kind ? (
        <div className="oc-file">
          <span className={`oc-file-mark ${kind.tone}`} aria-hidden>
            {kind.badge}
          </span>
          <div className="oc-file-meta">
            <strong title={stored.name}>{stored.name}</strong>
            <span>
              {stored.uploadedAt
                ? `Uploaded ${formatDate(stored.uploadedAt)}`
                : "Current file"}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onDownload}
            disabled={downloading}
          >
            <FiDownload size={14} /> {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      ) : (
        <div className="oc-file is-empty">
          <span className="oc-file-mark is-empty" aria-hidden>
            <FiFile size={16} />
          </span>
          <div className="oc-file-meta">
            <strong>{emptyTitle}</strong>
            <span>{editing ? addHint : emptyHint}</span>
          </div>
        </div>
      )}

      {editing && (
        <div
          className={`replace-file-drop oc-drop ${selected ? "is-selected" : ""}`}
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
              <span>{stored ? replaceHint : addHint}</span>
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
              onClick={() => onSelected(null)}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilesCard({
  editing,
  company,
  deckFile,
  reportFile,
  deckKey,
  reportKey,
  onDeckSelected,
  onReportSelected,
  onDownload,
  downloading,
}: {
  editing: boolean;
  company: OutreachDetail | null;
  deckFile: File | null;
  reportFile: File | null;
  deckKey: number;
  reportKey: number;
  onDeckSelected: (file: File | null) => void;
  onReportSelected: (file: File | null) => void;
  onDownload: (which: FileKey) => void;
  downloading: FileKey | null;
}) {
  const deck = company?.pitchDeckFileName
    ? {
        name: company.pitchDeckFileName,
        uploadedAt: company.pitchDeckUploadedAt,
      }
    : company?.pitchDeckUrl
      ? { name: "Pitch deck", uploadedAt: company.pitchDeckUploadedAt }
      : null;

  const report = company?.reportFileName
    ? { name: company.reportFileName, uploadedAt: company.reportUploadedAt }
    : company?.reportUrl
      ? { name: "Findings report", uploadedAt: company.reportUploadedAt }
      : null;

  return (
    <section className="card oc-card oc-slot-files">
      <div className="oc-card-head">
        <h2 className="oc-card-title">Files</h2>
      </div>

      <FileSlot
        title="Pitch deck (PDF)"
        stored={deck}
        emptyTitle="No deck yet"
        emptyHint="Add one with Edit"
        editing={editing}
        selected={deckFile}
        onSelected={onDeckSelected}
        inputKey={deckKey}
        accept="application/pdf,.pdf"
        chooseLabel={deck ? "Choose a new PDF" : "Choose a PDF"}
        replaceHint="Replaces the current pitch deck."
        addHint="Optional PDF, up to 20 MB."
        onDownload={() => onDownload("deck")}
        downloading={downloading === "deck"}
      />

      <FileSlot
        title="Findings report"
        stored={report}
        emptyTitle="No report yet"
        emptyHint="Add one with Edit"
        editing={editing}
        selected={reportFile}
        onSelected={onReportSelected}
        inputKey={reportKey}
        accept={REPORT_ACCEPT}
        chooseLabel={report ? "Choose a new report" : "Choose a report"}
        replaceHint="Replaces the current findings report."
        addHint="Optional. DOCX, TXT or PDF, up to 20 MB."
        onDownload={() => onDownload("report")}
        downloading={downloading === "report"}
      />
    </section>
  );
}
