import { api, extractErrorMessage } from "./api";
import type { PagedResult } from "./types";

export const BookingStatus = {
  Pending: "Pending",
  Confirmed: "Confirmed",
  Declined: "Declined",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const MeetingType = {
  InPerson: 0,
  OnlineMeeting: 1,
  PhoneCall: 2,
} as const;
export type MeetingType = (typeof MeetingType)[keyof typeof MeetingType];

export const meetingTypeLabel = (m: MeetingType): string =>
  m === MeetingType.InPerson
    ? "In person"
    : m === MeetingType.OnlineMeeting
      ? "Online meeting"
      : "Phone call";

export interface Booking {
  id: number;
  fullName: string;
  jobTitle?: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  helpWith: string;
  problemDescription: string;
  sessionGoal: string;
  meeting: MeetingType;
  date: string;
  time: string;
  contactPermission: boolean;
  createdAt: string;
  updatedAt?: string;
  status: BookingStatus;
  respondedByStaffName?: string | null;
  respondedAt?: string | null;
  responseMessage?: string | null;
  declineReason?: string | null;
}

export interface RespondToBookingInput {
  status: typeof BookingStatus.Confirmed | typeof BookingStatus.Declined;
  message: string;
  declineReason?: string;
}

export async function getAllBookings(
  page = 1,
  pageSize = 10,
  status?: BookingStatus,
): Promise<PagedResult<Booking>> {
  const { data } = await api.get<PagedResult<Booking>>("/api/v1/bookings", {
    params: { page, pageSize, status },
  });
  return data;
}

export async function respondToBooking(
  id: number,
  input: RespondToBookingInput,
): Promise<Booking> {
  try {
    const { data } = await api.patch<Booking>(
      `/api/v1/bookings/${id}/respond`,
      input,
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't send that response."));
  }
}

export function defaultSubject(
  status: typeof BookingStatus.Confirmed | typeof BookingStatus.Declined,
): string {
  return status === BookingStatus.Confirmed
    ? "Your consultation booking has been confirmed"
    : "An update on your consultation booking request";
}
