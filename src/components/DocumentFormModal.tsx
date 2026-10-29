// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as documentService from "../services/documentService";
import {
  DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_BYTES,
} from "../services/documentService";

export default function DocumentFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!DOCUMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
      setError(
        "That file type isn't supported. Use PDF, Word, Excel, PowerPoint, TXT, PNG or JPG.",
      );
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError("That file is over 20 MB.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await documentService.uploadDocument(
        file,
        title.trim(),
        description.trim(),
      );
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't upload that document.",
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
            <h2 style={{ fontSize: 19 }}>Add document</h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              Everyone on the team will be able to download it.
            </p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <div className="field">
          <label>File</label>
          <input
            type="file"
            accept={DOCUMENT_EXTENSIONS.join(",")}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="field-hint">
            PDF, Word, Excel, PowerPoint, TXT, PNG or JPG. Up to 20 MB.
          </div>
        </div>

        <div className="field">
          <label>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="For example: Service contract. Leave blank to use the file name."
            maxLength={150}
          />
        </div>

        <div className="field">
          <label>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional. What it is, or when to use it."
            maxLength={500}
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
            {loading ? "Uploading…" : "Add document"}
          </button>
        </div>
      </div>
    </div>
  );
}
