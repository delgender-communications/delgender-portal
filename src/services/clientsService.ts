import { api, extractErrorMessage } from "./api";
import type { PagedResult } from "./types";

export const ClientStatus = {
  Pending: "Pending",
  Working: "Working",
  Declined: "Declined",
} as const;
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export interface Client {
  id: number;
  companyName: string;
  contactFullName: string;
  contactJobTitle?: string | null;
  email: string;
  phoneNumber: string;
  industry: string;
  status: ClientStatus;
  workingSince?: string | null;
  workingUntil?: string | null;
  createdAt: string;
}

export interface CreateClientInput {
  fullName: string;
  jobTitle?: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  status: ClientStatus;
  contactPermission?: boolean;
}

export async function getClients(
  page = 1,
  pageSize = 15,
  status?: ClientStatus,
): Promise<PagedResult<Client>> {
  const { data } = await api.get<PagedResult<Client>>("/api/v1/clients", {
    params: { page, pageSize, status },
  });
  return data;
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  try {
    const { data } = await api.post<Client>("/api/v1/clients", input);
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't add that client."));
  }
}

export async function updateClientStatus(
  id: number,
  status: ClientStatus,
  requestFeedback = false,
): Promise<Client> {
  try {
    const { data } = await api.patch<Client>(`/api/v1/clients/${id}/status`, {
      status,
      requestFeedback,
    });
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't update that client."));
  }
}
