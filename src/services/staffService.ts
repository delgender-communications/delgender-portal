import { api, extractErrorMessage } from "./api";
import type { Staff, StaffRole } from "./authService";
import type { PagedResult } from "./types";

export interface CreateStaffInput {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  role: StaffRole;
}

export interface UpdateStaffInput {
  name?: string;
  surname?: string;
  phoneNumber?: string;
  jobTitle?: string;
  role?: StaffRole;
  isActive?: boolean;
}

export async function getAllStaff(
  page = 1,
  pageSize = 50,
): Promise<PagedResult<Staff>> {
  const { data } = await api.get<PagedResult<Staff>>("/api/v1/staff", {
    params: { page, pageSize },
  });
  return data;
}

export async function createStaff(input: CreateStaffInput): Promise<Staff> {
  try {
    const { data } = await api.post<Staff>("/api/v1/staff", input);
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't add that staff member."),
    );
  }
}

export async function updateStaff(
  id: number,
  input: UpdateStaffInput,
): Promise<Staff> {
  try {
    const { data } = await api.patch<Staff>(`/api/v1/staff/${id}`, input);
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't update that staff member."),
    );
  }
}

export async function removeMyProfilePicture(): Promise<Staff> {
  try {
    const { data } = await api.delete<Staff>(
      "/api/v1/staff/me/profile-picture",
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't remove that picture."),
      { cause: error },
    );
  }
}

export async function uploadMyProfilePicture(file: File): Promise<Staff> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const { data } = await api.post<Staff>(
      "/api/v1/staff/me/profile-picture",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't upload that picture."),
    );
  }
}

// ---------- change requests ----------
// Staff can't edit their own name, email or phone number. They ask, and an admin
// approves or declines. Nothing changes until it's approved.

export const ChangeRequestType = {
  Name: "Name",
  Email: "Email",
  PhoneNumber: "PhoneNumber",
} as const;
export type ChangeRequestType =
  (typeof ChangeRequestType)[keyof typeof ChangeRequestType];

export type ChangeRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export interface ChangeRequest {
  id: number;
  staffId: number;
  staffName: string;
  staffCode: string;
  type: ChangeRequestType;
  from: string;
  to: string;
  status: ChangeRequestStatus;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewNote?: string | null;
}

export function changeRequestLabel(type: ChangeRequestType): string {
  if (type === ChangeRequestType.Name) return "name";
  if (type === ChangeRequestType.Email) return "email";
  return "phone number";
}

export async function getMyChangeRequests(): Promise<ChangeRequest[]> {
  const { data } = await api.get<ChangeRequest[]>(
    "/api/v1/staff/me/change-requests",
  );
  return data;
}

export async function requestChange(input: {
  type: ChangeRequestType;
  newValue: string;
  newSurname?: string;
}): Promise<ChangeRequest> {
  try {
    const { data } = await api.post<ChangeRequest>(
      "/api/v1/staff/me/change-requests",
      input,
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't send that request."), {
      cause: error,
    });
  }
}

export async function cancelChangeRequest(id: number): Promise<void> {
  try {
    await api.delete(`/api/v1/staff/me/change-requests/${id}`);
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't cancel that request."),
      { cause: error },
    );
  }
}

// Admin only.
export async function getChangeRequests(
  status: ChangeRequestStatus = "Pending",
): Promise<ChangeRequest[]> {
  const { data } = await api.get<ChangeRequest[]>(
    "/api/v1/staff/change-requests",
    { params: { status } },
  );
  return data;
}

export async function reviewChangeRequest(
  id: number,
  decision: "approve" | "reject",
  note?: string,
): Promise<ChangeRequest> {
  try {
    const { data } = await api.post<ChangeRequest>(
      `/api/v1/staff/change-requests/${id}/${decision}`,
      { note: note?.trim() || null },
    );
    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't save that decision."),
      { cause: error },
    );
  }
}
