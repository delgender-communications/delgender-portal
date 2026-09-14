// external
import { useEffect, useRef, useState } from "react";
import { FiX, FiPlus, FiTrash2 } from "react-icons/fi";

// internal
import * as invoiceService from "../services/invoiceService";
import type { Invoice, InvoiceItemInput } from "../services/invoiceService";
import * as customerService from "../services/customerService";
import type { Customer } from "../services/customerService";
import { formatCurrency } from "../utils/format";

interface Props {
  invoice?: Invoice | null;
  onClose: () => void;
  onSaved: (invoice: Invoice) => void;
}

const emptyItem: InvoiceItemInput = {
  description: "",
  quantity: 1,
  unitPrice: 0,
  taxRate: 0,
  discountAmount: 0,
};

function lineTotal(item: InvoiceItemInput): number {
  const taxable = item.quantity * item.unitPrice - item.discountAmount;
  return taxable + taxable * (item.taxRate / 100);
}

export default function InvoiceEditorModal({
  invoice,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!invoice;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [dueDate, setDueDate] = useState(invoice?.dueDate?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [items, setItems] = useState<InvoiceItemInput[]>(
    invoice?.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      taxRate: i.taxRate,
      discountAmount: i.discountAmount,
    })) ?? [{ ...emptyItem }],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (invoice) {
      setCustomer({
        id: invoice.customerId,
        fullName: invoice.customerName,
        companyName: invoice.customerCompany,
        email: invoice.customerEmail,
        phoneNumber: "",
        industry: "",
      });
    }
  }, [invoice]);

  useEffect(() => {
    if (isEdit || !customerQuery.trim()) {
      setCustomerResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      customerService.searchCustomers(customerQuery).then(setCustomerResults);
    }, 250);
  }, [customerQuery, isEdit]);

  const updateItem = (index: number, patch: Partial<InvoiceItemInput>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  };

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const totals = items.reduce(
    (acc, it) => {
      acc.subtotal += it.quantity * it.unitPrice;
      acc.discount += it.discountAmount;
      acc.total += lineTotal(it);
      return acc;
    },
    { subtotal: 0, discount: 0, total: 0 },
  );

  const handleSubmit = async () => {
    setError(null);

    if (!isEdit && !customer) {
      setError("Choose a customer for this invoice.");
      return;
    }
    if (!dueDate) {
      setError("Set a due date.");
      return;
    }
    if (
      items.length === 0 ||
      items.some(
        (i) => !i.description.trim() || i.unitPrice < 0 || i.quantity <= 0,
      )
    ) {
      setError(
        "Every line item needs a description, a quantity, and a non-negative price.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = isEdit
        ? await invoiceService.updateInvoice(invoice!.id, {
            dueDate,
            notes: notes || undefined,
            items,
          })
        : await invoiceService.createInvoice({
            customerId: customer!.id,
            dueDate,
            notes: notes || undefined,
            items,
          });
      onSaved(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save this invoice.",
      );
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
          <h2 style={{ fontSize: 19 }}>
            {isEdit ? `Edit ${invoice!.invoiceNumber}` : "New invoice"}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {!isEdit && (
          <div className="field" style={{ position: "relative" }}>
            <label>Customer</label>
            {customer ? (
              <div className="chosen-customer">
                <div>
                  <strong>{customer.fullName}</strong>
                  <span className="text-muted">
                    {" "}
                    · {customer.companyName || customer.email}
                  </span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setCustomer(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  value={customerQuery}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search by name, email or company…"
                />
                {showResults && customerResults.length > 0 && (
                  <div className="customer-results">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomer(c);
                          setShowResults(false);
                        }}
                      >
                        <strong>{c.fullName}</strong>
                        <span className="text-muted">
                          {" "}
                          · {c.companyName || c.email}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="field">
          <label>Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Line items</label>
          <div className="items-table">
            <div className="items-table-head">
              <span>Description</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Tax %</span>
              <span>Discount</span>
              <span>Total</span>
              <span></span>
            </div>
            {items.map((item, i) => (
              <div className="items-table-row" key={i}>
                <input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(i, { description: e.target.value })
                  }
                  placeholder="Service description"
                />
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={item.quantity}
                  onFocus={(e) => {
                    if (item.quantity === 0) e.currentTarget.select();
                  }}
                  onChange={(e) =>
                    updateItem(i, { quantity: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onFocus={(e) => {
                    if (item.unitPrice === 0) e.currentTarget.select();
                  }}
                  onChange={(e) =>
                    updateItem(i, { unitPrice: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={item.taxRate}
                  onFocus={(e) => {
                    if (item.taxRate === 0) e.currentTarget.select();
                  }}
                  onChange={(e) =>
                    updateItem(i, { taxRate: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.discountAmount}
                  onFocus={(e) => {
                    if (item.discountAmount === 0) e.currentTarget.select();
                  }}
                  onChange={(e) =>
                    updateItem(i, { discountAmount: Number(e.target.value) })
                  }
                />
                <span className="item-line-total">
                  {formatCurrency(lineTotal(item))}
                </span>
                <button
                  className="icon-btn"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 10 }}
            onClick={() => setItems((p) => [...p, { ...emptyItem }])}
          >
            <FiPlus size={14} /> Add line
          </button>
        </div>

        <div className="field">
          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <div className="invoice-totals">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
          <span>Discount</span>
          <span>-{formatCurrency(totals.discount)}</span>
          <span className="grand-total">Total due</span>
          <span className="grand-total">{formatCurrency(totals.total)}</span>
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
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving…" : isEdit ? "Save changes" : "Create invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
