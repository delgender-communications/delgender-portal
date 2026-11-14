// internal
import StaffAvatar from "../StaffAvatar";
import { timeAgo } from "../../utils/outreachHelpers";
import type { NoteEditor } from "../../services/outreachService";

// More than this and the rest collapse into a "+3".
const MAX_HEADS = 5;

const editsLabel = (count: number) =>
  `${count} ${count === 1 ? "edit" : "edits"}`;

/**
 * Who has edited a company's notes: a row of their pictures (most recent first, with
 * the latest ringed), a name and edit count when you hover, and a plain "last edited
 * by" line beside it.
 */
export default function NoteEditors({
  editors,
  hasNotes,
}: {
  editors: NoteEditor[];
  // True when notes are saved, even if we don't know who wrote them (older notes).
  hasNotes: boolean;
}) {
  if (editors.length === 0) {
    return (
      <div className="oc-editors oc-editors-empty text-small text-muted">
        {hasNotes
          ? "Who wrote these notes wasn't recorded."
          : "No one has added notes yet."}
      </div>
    );
  }

  const latest = editors[0];
  const shown = editors.slice(0, MAX_HEADS);
  const rest = editors.slice(MAX_HEADS);

  return (
    <div className="oc-editors">
      <div
        className="oc-editor-stack"
        role="list"
        aria-label="People who have edited these notes"
      >
        {shown.map((editor, index) => (
          <span
            key={editor.staffId}
            role="listitem"
            tabIndex={0}
            className={`oc-editor${index === 0 ? " is-latest" : ""}`}
            aria-label={`${editor.name}, ${editsLabel(editor.editCount)}, last edited ${timeAgo(editor.lastEditedAt)}`}
          >
            <StaffAvatar
              fullName={editor.name}
              profilePictureUrl={editor.profilePictureUrl}
              size={30}
            />
            <span className="oc-editor-tip" role="tooltip">
              <strong>{editor.name}</strong>
              <span>
                {editsLabel(editor.editCount)} · last{" "}
                {timeAgo(editor.lastEditedAt)}
              </span>
            </span>
          </span>
        ))}

        {rest.length > 0 && (
          <span
            role="listitem"
            tabIndex={0}
            className="oc-editor oc-editor-more"
            aria-label={`${rest.length} more: ${rest.map((e) => e.name).join(", ")}`}
          >
            +{rest.length}
            <span className="oc-editor-tip" role="tooltip">
              {rest.map((editor) => (
                <span key={editor.staffId}>
                  {editor.name} · {editsLabel(editor.editCount)}
                </span>
              ))}
            </span>
          </span>
        )}
      </div>

      <div className="oc-editors-last text-small">
        Last edited by <strong>{latest.name}</strong>
        <span className="text-muted"> · {timeAgo(latest.lastEditedAt)}</span>
      </div>
    </div>
  );
}
