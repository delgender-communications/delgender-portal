// external
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

// internal
import * as invoiceService from "../services/invoiceService";
import { InvoiceStatus } from "../services/invoiceService";
import type { Invoice } from "../services/invoiceService";
import StatusBadge from "../components/StatusBadge";
import InvoiceEditorModal from "../components/InvoiceEditorModal";
import InvoiceDetailsModal from "../components/InvoiceDetailsModal";
import { formatCurrency, formatDate } from "../utils/format";
import "./ListPage.css";

const TABS: { label: string; value?: InvoiceStatus }[] = [
  { label: "All" },
  { label: "Draft", value: InvoiceStatus.Draft },
  { label: "Sent", value: InvoiceStatus.Sent },
  { label: "Paid", value: InvoiceStatus.Paid },
  { label: "Overdue", value: InvoiceStatus.Overdue },
  { label: "Cancelled", value: InvoiceStatus.Cancelled },
];

export default function InvoicesPage() {
  const [tab, setTab] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditor, setShowEditor] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const load = () => {
    setLoading(true);
    invoiceService
      .getAllInvoices(page, 10, TABS[tab].value)
      .then((res) => {
        setInvoices(res.data);
        setTotalPages(res.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="text-muted">Bill clients and track what's been paid.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowEditor(true)}>
          <FiPlus size={16} /> New invoice
        </button>
      </div>

      <div className="pill-tabs" style={{ marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button
            key={t.label}
            className={`pill-tab ${tab === i ? "active" : ""}`}
            onClick={() => {
              setTab(i);
              setPage(1);
            }}
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
                <th>Invoice</th>
                <th>Client</th>
                <th>Due</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    Loading…
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No invoices here.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="clickable"
                    onClick={() => setViewingInvoice(inv)}
                  >
                    <td style={{ fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td>
                      <div>{inv.customerName}</div>
                      <div className="text-muted text-small">
                        {inv.customerCompany}
                      </div>
                    </td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td style={{ fontWeight: 600 }}>
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
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

      {showEditor && (
        <InvoiceEditorModal
          onClose={() => setShowEditor(false)}
          onSaved={(inv) => {
            setShowEditor(false);
            load();
            setViewingInvoice(inv);
          }}
        />
      )}

      {editingInvoice && (
        <InvoiceEditorModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSaved={(inv) => {
            setEditingInvoice(null);
            setViewingInvoice(inv);
            load();
          }}
        />
      )}

      {viewingInvoice && (
        <InvoiceDetailsModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onUpdated={(inv) => {
            setViewingInvoice(inv);
            load();
          }}
          onEdit={() => {
            setEditingInvoice(viewingInvoice);
            setViewingInvoice(null);
          }}
        />
      )}
    </div>
  );
}
