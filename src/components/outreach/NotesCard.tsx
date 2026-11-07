// external
import type { KeyboardEvent } from "react";

const MAX_NOTES = 4000;

export default function NotesCard({
  notes,
  onChange,
  dirty,
  saving,
  saved,
  onSave,
  saveWithForm = false,
}: {
  notes: string;
  onChange: (value: string) => void;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  /** Edit and add screens save the notes together with everything else. */
  saveWithForm?: boolean;
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

      <div className="field-hint" style={{ marginTop: 8 }}>
        {saveWithForm
          ? "Saved together with the rest of your changes."
          : "Notes can be edited by anyone."}
      </div>

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
