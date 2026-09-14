// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as bookingService from "../services/bookingService";
import {
  BookingStatus,
  defaultSubject,
  meetingTypeLabel,
} from "../services/bookingService";
import type { Booking } from "../services/bookingService";
import { formatDate } from "../utils/format";

interface Props {
  booking: Booking;
  action: typeof BookingStatus.Confirmed | typeof BookingStatus.Declined;
  onClose: () => void;
  onDone: (updated: Booking) => void;
}

function defaultMessage(booking: Booking, action: string): string {
  if (action === BookingStatus.Confirmed) {
    return `Hi ${booking.fullName},\n\nGreat news! Your consultation on ${formatDate(booking.date)} (${meetingTypeLabel(booking.meeting)}) is confirmed. We look forward to speaking with you.\n\nBest,\nDelgender Communications`;
  }
  return `Hi ${booking.fullName},\n\nThank you for your interest in Delgender Communications. Unfortunately we're not able to accommodate this booking request.\n\nBest,\nDelgender Communications`;
}

export default function RespondBookingModal({
  booking,
  action,
  onClose,
  onDone,
}: Props) {
  const [message, setMessage] = useState(defaultMessage(booking, action));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDecline = action === BookingStatus.Declined;
  const subject = defaultSubject(action);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Write the email that will be sent to the client.");
      return;
    }
    if (isDecline && !reason.trim()) {
      setError(
        "Add a reason for declining (kept internally on the booking record).",
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await bookingService.respondToBooking(booking.id, {
        status: action,
        message: message.trim(),
        declineReason: isDecline ? reason.trim() : undefined,
      });
      onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
              {isDecline ? "Decline booking" : "Confirm booking"}
            </h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              {booking.fullName} · {booking.companyName}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {isDecline && (
          <div className="field">
            <label>Reason for declining</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. No availability in the requested timeframe"
              rows={2}
            />
            <span className="field-hint">
              Kept on the booking record for internal reference — not sent to
              the client automatically.
            </span>
          </div>
        )}

        <div className="field">
          <label>Subject</label>
          <input value={subject} disabled style={{ opacity: 0.7 }} />
        </div>

        <div className="field">
          <label>Email to client</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
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
          >
            Cancel
          </button>
          <button
            className={`btn ${isDecline ? "btn-danger" : "btn-success"}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Sending…"
              : isDecline
                ? "Decline & send email"
                : "Confirm & send email"}
          </button>
        </div>
      </div>
    </div>
  );
}
