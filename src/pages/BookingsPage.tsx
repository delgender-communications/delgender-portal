// external
import { useEffect, useState } from "react";

// internal
import * as bookingService from "../services/bookingService";
import { BookingStatus } from "../services/bookingService";
import type { Booking } from "../services/bookingService";
import StatusBadge from "../components/StatusBadge";
import RespondBookingModal from "../components/RespondBookingModal";
import BookingDetailsModal from "../components/BookingDetailsModal";
import { formatDate } from "../utils/format";
import "./ListPage.css";

const TABS: { label: string; value?: bookingService.BookingStatus }[] = [
  { label: "Pending", value: BookingStatus.Pending },
  { label: "Confirmed", value: BookingStatus.Confirmed },
  { label: "Declined", value: BookingStatus.Declined },
  { label: "All" },
];

export default function BookingsPage() {
  const [tab, setTab] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [respondState, setRespondState] = useState<{
    booking: Booking;
    action: "Confirmed" | "Declined";
  } | null>(null);

  const load = () => {
    setLoading(true);
    bookingService
      .getAllBookings(page, 10, TABS[tab].value)
      .then((res) => {
        setBookings(res.data);
        setTotalPages(res.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const handleTab = (i: number) => {
    setTab(i);
    setPage(1);
  };

  const handleResponded = (updated: Booking) => {
    setRespondState(null);
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    if (TABS[tab].value && TABS[tab].value !== updated.status) {
      setBookings((prev) => prev.filter((b) => b.id !== updated.id));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bookings</h1>
          <p className="text-muted">
            Respond to consultation requests from the website.
          </p>
        </div>
      </div>

      <div className="pill-tabs" style={{ marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button
            key={t.label}
            className={`pill-tab ${tab === i ? "active" : ""}`}
            onClick={() => handleTab(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Company</th>
                <th>Requested for</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    Loading…
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No bookings here.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="clickable"
                    onClick={() => setDetailsBooking(b)}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.fullName}</div>
                      <div className="text-muted text-small">{b.email}</div>
                    </td>
                    <td>{b.companyName}</td>
                    <td>
                      {formatDate(b.date)} · {b.time.slice(0, 5)}
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {b.status === "Pending" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() =>
                              setRespondState({
                                booking: b,
                                action: "Confirmed",
                              })
                            }
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              setRespondState({
                                booking: b,
                                action: "Declined",
                              })
                            }
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDetailsBooking(b)}
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-muted text-small">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {detailsBooking && (
        <BookingDetailsModal
          booking={detailsBooking}
          onClose={() => setDetailsBooking(null)}
        />
      )}

      {respondState && (
        <RespondBookingModal
          booking={respondState.booking}
          action={respondState.action}
          onClose={() => setRespondState(null)}
          onDone={handleResponded}
        />
      )}
    </div>
  );
}
