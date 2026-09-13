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
