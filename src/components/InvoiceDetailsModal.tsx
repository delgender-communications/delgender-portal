// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as invoiceService from "../services/invoiceService";
import { InvoiceStatus } from "../services/invoiceService";
import type { Invoice } from "../services/invoiceService";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onUpdated: (invoice: Invoice) => void;
  onEdit: () => void;
}

export default function InvoiceDetailsModal({
  invoice,
  onClose,
  onUpdated,
  onEdit,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaidForm, setShowPaidForm] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const run = async (label: string, action: () => Promise<Invoice>) => {
    setLoading(label);
    setError(null);
    try {
      const updated = await action();
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
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
            <h2 style={{ fontSize: 19 }}>{invoice.invoiceNumber}</h2>
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              {invoice.customerName} · {invoice.customerCompany}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="detail-item">
            <div className="detail-label">Issue date</div>
            <div className="detail-value">{formatDate(invoice.issueDate)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Due date</div>
            <div className="detail-value">{formatDate(invoice.dueDate)}</div>
          </div>
          {invoice.paidAt && (
            <div className="detail-item">
              <div className="detail-label">Paid</div>
              <div className="detail-value">
                {formatDate(invoice.paidAt)}
                {invoice.paymentReference
                  ? ` · ${invoice.paymentReference}`
                  : ""}
              </div>
            </div>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ fontWeight: 700 }}>
                    {formatCurrency(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-totals" style={{ marginTop: 16 }}>
          <span>Subtotal</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
          <span>Tax</span>
          <span>{formatCurrency(invoice.taxAmount)}</span>
          <span>Discount</span>
          <span>-{formatCurrency(invoice.discountAmount)}</span>
          <span className="grand-total">Total due</span>
          <span className="grand-total">
            {formatCurrency(invoice.totalAmount)}
          </span>
        </div>

        {showPaidForm && (
          <div
            className="card"
            style={{ marginTop: 18, background: "var(--bg-raise)" }}
          >
            <div className="field">
              <label>Payment reference (optional)</label>
              <input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. EFT ref, receipt #"
              />
            </div>
            <div className="field" style={{ marginBottom: 6 }}>
              <label>Date paid</label>
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPaidForm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-success btn-sm"
                disabled={loading === "paid"}
                onClick={() =>
                  run("paid", () =>
                    invoiceService.updateInvoiceStatus(
                      invoice.id,
                      InvoiceStatus.Paid,
                      paymentReference || undefined,
                      paidDate,
                    ),
                  )
                }
              >
                Mark as paid
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          {invoice.status === InvoiceStatus.Draft && (
            <button className="btn btn-ghost" onClick={onEdit}>
              Edit
            </button>
          )}
          {(invoice.status === InvoiceStatus.Draft ||
            invoice.status === InvoiceStatus.Sent) && (
            <button
              className="btn btn-danger"
              disabled={loading === "cancel"}
              onClick={() =>
                run("cancel", () =>
                  invoiceService.updateInvoiceStatus(
                    invoice.id,
                    InvoiceStatus.Cancelled,
                  ),
                )
              }
            >
              Cancel invoice
            </button>
          )}
          {invoice.status !== InvoiceStatus.Paid &&
            invoice.status !== InvoiceStatus.Cancelled &&
            !showPaidForm && (
              <button
                className="btn btn-success"
                onClick={() => setShowPaidForm(true)}
              >
                Mark as paid
              </button>
            )}
          {invoice.status !== InvoiceStatus.Cancelled && (
            <button
              className="btn btn-primary"
              disabled={loading === "send"}
              onClick={() =>
                run("send", () => invoiceService.sendInvoice(invoice.id))
              }
            >
              {loading === "send"
                ? "Sending…"
                : invoice.status === InvoiceStatus.Draft
                  ? "Send to client"
                  : "Resend to client"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
