// external
import { useState } from "react";

export default function NotesExpandedModal({
  title = "Notes",
  subtitle,
  initial,
  placeholder,
  saving = false,
  error,
  onDone,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  initial: string;
  placeholder?: string;
  saving?: boolean;
  error?: string | null;
  // Called with the edited text. The parent decides what "done" means
  // (stash it in a form, or save it) and unmounts this modal when finished.
  onDone: (value: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dirty = draft !== initial;

  const cancel = () => {
    if (saving) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const done = () => {
    if (!dirty) {
      onClose();
      return;
    }
    void onDone(draft);
  };

  return (
    <div
      className="modal-backdrop notes-layer"
      onClick={(e) => {
        // stop the click reaching the modal this one sits inside
        e.stopPropagation();
        cancel();
      }}
    >
      <div
        className="modal-panel modal-wide notes-expanded-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 19 }}>{title}</h2>
            {subtitle && (
              <p className="text-muted text-small" style={{ marginTop: 4 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <textarea
          className="notes-expanded-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />

        {confirmDiscard ? (
          <div className="notes-discard">
            <p className="text-small">
              You have unsaved changes to these notes. If you close now, they'll
              be discarded.
            </p>
            <div className="notes-actions">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirmDiscard(false)}
              >
                Keep editing
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={onClose}
              >
                Discard changes
              </button>
            </div>
          </div>
        ) : (
          <div className="notes-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={cancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={done}
              disabled={saving}
            >
              {saving ? "Saving…" : "Done"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
