// external
import { FiX } from "react-icons/fi";
import type { ReactNode } from "react";

// internal
import type { Booking } from "../services/bookingService";
import { meetingTypeLabel } from "../services/bookingService";
import { formatDate, formatDateTime } from "../utils/format";
import StatusBadge from "./StatusBadge";

export default function BookingDetailsModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 19 }}>{booking.fullName}</h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              {booking.jobTitle ? `${booking.jobTitle}, ` : ""}
              {booking.companyName}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="detail-grid">
          <Detail
            label="Status"
            value={<StatusBadge status={booking.status} />}
          />
          <Detail
            label="Requested for"
            value={`${formatDate(booking.date)} at ${booking.time.slice(0, 5)}`}
          />
          <Detail
            label="Meeting type"
            value={meetingTypeLabel(booking.meeting)}
          />
          <Detail label="Industry" value={booking.industry} />
          <Detail label="Email" value={booking.email} />
          <Detail label="Phone" value={booking.phoneNumber} />
        </div>

        <Detail label="Help with" value={booking.helpWith} block />
        <Detail
          label="Problem description"
          value={booking.problemDescription}
          block
        />
        <Detail label="Session goal" value={booking.sessionGoal} block />

        {booking.status !== "Pending" && (
          <div className="response-block">
            <div
              className="card-title"
              style={{ marginBottom: 10, fontSize: 14 }}
            >
              Response
            </div>
            <p className="text-small text-muted" style={{ marginBottom: 10 }}>
              {booking.respondedByStaffName} ·{" "}
              {booking.respondedAt && formatDateTime(booking.respondedAt)}
            </p>
            {booking.declineReason && (
              <Detail
                label="Decline reason"
                value={booking.declineReason}
                block
              />
            )}
            <Detail
              label="Email sent to client"
              value={booking.responseMessage ?? ""}
              block
              preserveLines
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  block,
  preserveLines,
}: {
  label: string;
  value: ReactNode;
  block?: boolean;
  preserveLines?: boolean;
}) {
  return (
    <div className={block ? "detail-block" : "detail-item"}>
      <div className="detail-label">{label}</div>
      <div
        className="detail-value"
        style={preserveLines ? { whiteSpace: "pre-wrap" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
