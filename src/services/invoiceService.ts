import { api, extractErrorMessage } from "./api";
import type { PagedResult } from "./types";

export const InvoiceStatus = {
  Draft: "Draft",
  Sent: "Sent",
  Paid: "Paid",
  Overdue: "Overdue",
  Cancelled: "Cancelled",
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  totalAmount: number;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  bookingId?: number | null;
  createdByStaffName?: string | null;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAt?: string | null;
  paymentReference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  items: InvoiceItem[];
}

export interface CreateInvoiceInput {
  customerId: number;
  bookingId?: number;
  dueDate: string;
  notes?: string;
  items: InvoiceItemInput[];
}

export async function getAllInvoices(
  page = 1,
  pageSize = 10,
  status?: InvoiceStatus,
  customerId?: number,
): Promise<PagedResult<Invoice>> {
  const { data } = await api.get<PagedResult<Invoice>>("/api/v1/invoices", {
    params: { page, pageSize, status, customerId },
  });
  return data;
}

export async function getInvoiceById(id: number): Promise<Invoice> {
  const { data } = await api.get<Invoice>(`/api/v1/invoices/${id}`);
  return data;
}

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<Invoice> {
  try {
    const { data } = await api.post<Invoice>("/api/v1/invoices", input);
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't create that invoice."),
    );
  }
}

export async function updateInvoice(
  id: number,
  input: Omit<CreateInvoiceInput, "customerId" | "bookingId">,
): Promise<Invoice> {
  try {
    const { data } = await api.put<Invoice>(`/api/v1/invoices/${id}`, input);
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't update that invoice."),
    );
  }
}

export async function updateInvoiceStatus(
  id: number,
  status: InvoiceStatus,
  paymentReference?: string,
  paidAt?: string,
): Promise<Invoice> {
  try {
    const { data } = await api.patch<Invoice>(`/api/v1/invoices/${id}/status`, {
      status,
      paymentReference,
      paidAt,
    });
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't update the invoice status."),
    );
  }
}

export async function sendInvoice(
  id: number,
  message?: string,
): Promise<Invoice> {
  try {
    const { data } = await api.post<Invoice>(`/api/v1/invoices/${id}/send`, {
      message,
    });
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't send that invoice."));
  }
}
