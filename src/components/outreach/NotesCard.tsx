// external
import type { KeyboardEvent } from "react";

// internal
import NoteEditors from "./NoteEditors";
import type { NoteEditor } from "../../services/outreachService";

const MAX_NOTES = 4000;

export default function NotesCard({
  notes,
  onChange,
  dirty,
  saving,
  saved,
  onSave,
  saveWithForm = false,
  editors,
  hasSavedNotes,
}: {
  notes: string;
  onChange: (value: string) => void;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  saveWithForm?: boolean;
  editors: NoteEditor[] | null;
  hasSavedNotes: boolean;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (!saveWithForm && dirty && !saving) onSave();
    }
  };

  return (
    <section className="card oc-card oc-slot-notes">
      <div className="oc-card-head">
        <h2 className="oc-card-title">Notes</h2>
        <span className="text-muted text-small oc-count">
          {notes.length}/{MAX_NOTES}
        </span>
      </div>

      <textarea
        className="oc-notes"
        value={notes}
        maxLength={MAX_NOTES}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Issues they're facing, or anything the next person should know."
        aria-label="Notes"
      />

      {editors && <NoteEditors editors={editors} hasNotes={hasSavedNotes} />}

      {saveWithForm && (
        <div className="field-hint" style={{ marginTop: 8 }}>
          Saved together with the rest of your changes.
        </div>
      )}

      {!saveWithForm && (
        <div className="oc-notes-actions">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={onSave}
            disabled={saving || !dirty}
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
          {dirty && !saving && (
            <span className="oc-unsaved">Unsaved changes</span>
          )}
          {saved && !dirty && (
            <span className="text-muted text-small">Saved</span>
          )}
        </div>
      )}
    </section>
  );
}
