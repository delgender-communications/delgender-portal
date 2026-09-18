// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as clientService from "../services/clientsService";
import { ClientStatus } from "../services/clientsService";
import type { Client } from "../services/clientsService";
import { formatDuration } from "../utils/format";

interface Props {
  client: Client;
  nextStatus: ClientStatus;
  onClose: () => void;
  onDone: (client: Client) => void;
}

const HEADINGS: Record<string, string> = {
  Working: "Start working with this client",
  Declined: "Stop working with this client",
  Pending: "Move back to pending",
};

export default function ChangeClientStatusModal({
  client,
  nextStatus,
  onClose,
  onDone,
}: Props) {
  const [requestFeedback, setRequestFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Feedback is only relevant when an actual collaboration is ending - not when
  // declining someone we never worked with in the first place.
  const isEndingCollaboration =
    client.status === ClientStatus.Working &&
    nextStatus !== ClientStatus.Working;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await clientService.updateClientStatus(
        client.id,
        nextStatus,
        isEndingCollaboration && requestFeedback,
      );
      onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 19 }}>{HEADINGS[nextStatus]}</h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              {client.companyName}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {isEndingCollaboration && client.workingSince && (
          <p className="text-muted text-small" style={{ marginBottom: 18 }}>
            You've worked with {client.companyName} for{" "}
            {formatDuration(client.workingSince)}. That will be kept on their
            record.
          </p>
        )}

        {isEndingCollaboration && (
          <div className="feedback-prompt">
            <label
              className="checkbox-row"
              style={{ alignItems: "flex-start" }}
            >
              <input
                type="checkbox"
                checked={requestFeedback}
                onChange={(e) => setRequestFeedback(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                Ask {client.companyName} for feedback on working with us
              </span>
            </label>
            {requestFeedback && (
              <p className="text-muted text-small" style={{ marginTop: 10 }}>
                An email will be sent to {client.email} asking for their
                feedback.
              </p>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`btn ${nextStatus === ClientStatus.Working ? "btn-success" : "btn-danger"}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
