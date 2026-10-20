import { api, extractErrorMessage } from "./api";
import type { PagedResult } from "./types";

export const OutreachStatus = {
  Researching: "Researching",
  Ready: "Ready",
  Emailed: "Emailed",
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
