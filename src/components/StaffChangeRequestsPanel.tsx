// external
import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

// internal
import * as staffService from "../services/staffService";
import {
  ChangeRequestType,
  changeRequestLabel,
  type ChangeRequest,
} from "../services/staffService";
import { formatRelative } from "../utils/format";
import { formatPhone } from "../utils/phone";

const show = (type: ChangeRequestType, value: string) =>
  type === ChangeRequestType.PhoneNumber ? formatPhone(value) : value;

/**
 * Admin only. Staff can't change their own name, email or phone number. They ask,
 * and the request lands here.
 */
export default function StaffChangeRequestsPanel({
  onApproved,
}: {
  // Called after an approval, so the staff list shows the new details.
  onApproved: () => void;
}) {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [decliningId, setDecliningId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    staffService
      .getChangeRequests("Pending")
      .then((res) => {
        if (!cancelled) setRequests(res);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load change requests.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const decide = async (
    request: ChangeRequest,
    decision: "approve" | "reject",
  ) => {
    setBusyId(request.id);
    setError(null);
    try {
      await staffService.reviewChangeRequest(
        request.id,
        decision,
        decision === "reject" ? note : undefined,
      );
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setDecliningId(null);
      setNote("");
      if (decision === "approve") onApproved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save that decision.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // Nothing waiting: stay out of the way.
  if (loading || (requests.length === 0 && !error)) return null;

  return (
    <div className="card" style={{ marginBottom: 22 }}>
      <div className="card-title" style={{ marginBottom: 6 }}>
        Change requests{" "}
        <span className="badge badge-pending">{requests.length} waiting</span>
      </div>
      <p className="text-muted text-small" style={{ marginBottom: 14 }}>
        Staff can't change their own name, email or phone number. Approving
        applies the change straight away.
      </p>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="request-list">
        {requests.map((r) => (
          <div className="request-item" key={r.id}>
            <div className="request-main">
              <div className="request-title">
                {r.staffName}{" "}
                <span className="text-muted text-small">
                  {r.staffCode} · {formatRelative(r.createdAt)}
                </span>
              </div>
              <div className="text-small">
                Wants to change their {changeRequestLabel(r.type)}:{" "}
                <span className="text-muted">{show(r.type, r.from)}</span>
                {" → "}
                <strong>{show(r.type, r.to)}</strong>
              </div>

              {decliningId === r.id && (
                <div
                  className="field"
                  style={{ marginTop: 10, marginBottom: 0 }}
                >
                  <label htmlFor={`note-${r.id}`}>Reason (optional)</label>
                  <input
                    id={`note-${r.id}`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder="They'll see this"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="request-actions">
              {decliningId === r.id ? (
                <>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void decide(r, "reject")}
                  >
                    Confirm decline
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setDecliningId(null);
                      setNote("");
                    }}
                  >
                    Back
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-success btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => void decide(r, "approve")}
                  >
                    <FiCheck size={14} /> Approve
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={busyId === r.id}
                    onClick={() => {
                      setDecliningId(r.id);
                      setNote("");
                    }}
                  >
                    <FiX size={14} /> Decline
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
