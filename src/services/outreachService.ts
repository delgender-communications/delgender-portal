import axios from "axios";
import { api, extractErrorMessage } from "./api";
import type { PagedResult } from "./types";

export const OutreachStatus = {
  Researching: "Researching",
  Ready: "Ready",
  Emailed: "Emailed",
  Cancelled: "Cancelled",
} as const;
export type OutreachStatus =
  (typeof OutreachStatus)[keyof typeof OutreachStatus];

export const OUTREACH_STATUSES: {
  value: OutreachStatus;
  label: string;
  description: string;
  badge: string;
}[] = [
  {
    value: OutreachStatus.Researching,
    label: "Researching",
    description: "The company is still being researched.",
    badge: "badge-pending",
  },
  {
    value: OutreachStatus.Ready,
    label: "Ready",
    description:
      "Everything is ready. Anyone can download the pitch deck and email the company.",
    badge: "badge-sent",
  },
  {
    value: OutreachStatus.Emailed,
    label: "Emailed",
    description: "Everything is done.",
    badge: "badge-confirmed",
  },
  {
    value: OutreachStatus.Cancelled,
    label: "Cancelled",
    description:
      "We decided not to pursue this company, for example because we realised we don't align.",
    badge: "badge-cancelled",
  },
];

export interface OutreachListItem {
  id: number;
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  status: OutreachStatus;
  pitchDeckFileName?: string | null;
  pitchDeckUrl?: string | null;
  createdAt: string;
}

export interface OutreachLog {
  id: number;
  actorName: string;
  message: string;
  createdAt: string;
}

export interface OutreachDetail {
  id: number;
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  notes?: string | null;
  status: OutreachStatus;
  pitchDeckFileName?: string | null;
  pitchDeckUrl?: string | null;
  pitchDeckUploadedAt?: string | null;
  addedByStaffId: number;
  addedByName: string;
  createdAt: string;
  updatedAt: string;
  logs: OutreachLog[];
}

export interface OutreachInput {
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  notes?: string | null;
  status: OutreachStatus;
}

export async function getOutreach(
  page = 1,
  pageSize = 15,
  status?: OutreachStatus,
): Promise<PagedResult<OutreachListItem>> {
  const { data } = await api.get<PagedResult<OutreachListItem>>(
    "/api/v1/outreach",
    { params: { page, pageSize, status } },
  );
  return data;
}

export async function getOutreachById(id: number): Promise<OutreachDetail> {
  try {
    const { data } = await api.get<OutreachDetail>(`/api/v1/outreach/${id}`);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't open that company."));
  }
}

export async function createOutreach(
  input: OutreachInput,
): Promise<OutreachDetail> {
  try {
    const { data } = await api.post<OutreachDetail>("/api/v1/outreach", input);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't add that company."));
  }
}

export async function updateOutreach(
  id: number,
  input: OutreachInput,
): Promise<OutreachDetail> {
  try {
    const { data } = await api.put<OutreachDetail>(
      `/api/v1/outreach/${id}`,
      input,
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't update that company."),
    );
  }
}

export async function updateOutreachNotes(
  id: number,
  notes: string,
): Promise<OutreachDetail> {
  try {
    const { data } = await api.patch<OutreachDetail>(
      `/api/v1/outreach/${id}/notes`,
      { notes },
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't save those notes."));
  }
}

export async function uploadPitchDeck(
  id: number,
  file: File,
): Promise<OutreachDetail> {
  const form = new FormData();
  form.append("file", file);
  try {
    const { data } = await api.post<OutreachDetail>(
      `/api/v1/outreach/${id}/pitch-deck`,
      form,
      {
        transformRequest: (payload, headers) => {
          if (headers) {
            delete headers["Content-Type"];
            delete headers["content-type"];
          }
          return payload;
        },
      },
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't upload that pitch deck."),
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
export async function downloadPitchDeck(
  id: number,
  fileName?: string | null,
): Promise<void> {
  try {
    const { data } = await api.get<Blob>(`/api/v1/outreach/${id}/pitch-deck`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "pitch-deck.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (error) {
    throw new Error(
      await blobErrorMessage(error, "Couldn't download that pitch deck."),
      { cause: error },
    );
  }
}

export async function sendOutreachEmail(id: number): Promise<OutreachDetail> {
  try {
    const { data } = await api.post<OutreachDetail>(
      `/api/v1/outreach/${id}/send-email`,
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't send that email."), {
      cause: error,
    });
  }
}

export async function markOutreachEmailed(id: number): Promise<OutreachDetail> {
  try {
    const { data } = await api.post<OutreachDetail>(
      `/api/v1/outreach/${id}/mark-emailed`,
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't mark that as emailed."),
      { cause: error },
    );
  }
}
