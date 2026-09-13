import { InvoiceStatus } from "../services/invoiceService";
import type { Invoice } from "../services/invoiceService";

// Belt-and-braces: the backend also flags overdue invoices (on login, on startup,
// and defensively whenever it returns invoice data), but the frontend checks too
// so the portal is never showing a stale "Sent" for something clearly past due,
// even for a moment.
export function isOverdue(
  invoice: Pick<Invoice, "status" | "dueDate">,
): boolean {
  if (invoice.status !== InvoiceStatus.Sent) {
    return false;
  }
  return new Date(invoice.dueDate) < new Date(new Date().toDateString());
}

export function displayStatus(
  invoice: Pick<Invoice, "status" | "dueDate">,
): InvoiceStatus {
  return isOverdue(invoice) ? InvoiceStatus.Overdue : invoice.status;
}
