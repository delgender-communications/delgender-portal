import axios from "axios";
import { api, extractErrorMessage } from "./api";

export interface TeamDocument {
  id: number;
  title: string;
  description?: string | null;
  fileName: string;
  sizeBytes: number;
  uploadedByStaffId: number;
  uploadedByName: string;
  createdAt: string;
}

export interface DocumentEmailTemplate {
  subject: string;
  body: string;
}

export interface SendDocumentsInput {
  clientId: number;
  documentIds: number[];
  subject: string;
  body: string;
}

export interface DocumentsSent {
  recipientEmail: string;
  documentCount: number;
}

export const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
];

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function getDocuments(): Promise<TeamDocument[]> {
  try {
    const { data } = await api.get<TeamDocument[]>("/api/v1/documents");
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't load the documents."),
      {
        cause: error,
      },
    );
  }
}

export async function uploadDocument(
  file: File,
  title: string,
  description: string,
): Promise<TeamDocument> {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  if (description) form.append("description", description);
  try {
    const { data } = await api.post<TeamDocument>("/api/v1/documents", form, {
      // Lets the browser set the multipart boundary itself.
      transformRequest: (payload, headers) => {
        if (headers) {
          delete headers["Content-Type"];
          delete headers["content-type"];
        }
        return payload;
      },
    });
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't upload that document."),
      {
        cause: error,
      },
    );
  }
}

async function blobErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await error.response.data.text()) as {
        message?: string;
        detail?: string;
      };
      return body.detail || body.message || fallback;
    } catch {
      return fallback;
    }
  }
  return extractErrorMessage(error, fallback);
}

// Goes through the API (with the login token) instead of linking straight to
// the file host, so the browser always saves it as a file.
export async function downloadDocument(
  id: number,
  fileName: string,
): Promise<void> {
  try {
    const { data } = await api.get<Blob>(`/api/v1/documents/${id}/download`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (error) {
    throw new Error(
      await blobErrorMessage(error, "Couldn't download that document."),
      { cause: error },
    );
  }
}

export async function deleteDocument(id: number): Promise<void> {
  try {
    await api.delete(`/api/v1/documents/${id}`);
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't delete that document."),
      {
        cause: error,
      },
    );
  }
}

export async function getEmailTemplate(
  clientId: number,
): Promise<DocumentEmailTemplate> {
  try {
    const { data } = await api.get<DocumentEmailTemplate>(
      "/api/v1/documents/email-template",
      { params: { clientId } },
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't load the email text."),
      { cause: error },
    );
  }
}

export async function sendDocumentsEmail(
  input: SendDocumentsInput,
): Promise<DocumentsSent> {
  try {
    const { data } = await api.post<DocumentsSent>(
      "/api/v1/documents/send-email",
      input,
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't send those documents."),
      {
        cause: error,
      },
    );
  }
}
