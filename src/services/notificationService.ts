import { api } from "./api";
import type { PagedResult } from "./types";

export const NotificationType = {
  NewLead: "NewLead",
  NewBooking: "NewBooking",
  InvoiceOverdue: "InvoiceOverdue",
  ChangeRequest: "ChangeRequest",
  ChangeRequestDecision: "ChangeRequestDecision",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationSummary {
  badge: number;
  unread: number;
  total: number;
}

export interface NotificationPreferences {
  notifyNewLeads: boolean;
  notifyNewBookings: boolean;
  notifyOverdueInvoices: boolean;
}

export async function getNotifications(
  page = 1,
  pageSize = 20,
  unreadOnly = false,
): Promise<PagedResult<AppNotification>> {
  const { data } = await api.get<PagedResult<AppNotification>>(
    "/api/v1/notifications",
    { params: { page, pageSize, unreadOnly } },
  );
  return data;
}

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const { data } = await api.get<NotificationSummary>(
    "/api/v1/notifications/summary",
  );
  return data;
}

export async function markNotificationsSeen(): Promise<NotificationSummary> {
  const { data } = await api.post<NotificationSummary>(
    "/api/v1/notifications/seen",
  );
  return data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/api/v1/notifications/${id}/read`);
}

export async function markNotificationUnread(id: number): Promise<void> {
  await api.post(`/api/v1/notifications/${id}/unread`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/api/v1/notifications/read-all");
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await api.get<NotificationPreferences>(
    "/api/v1/notifications/preferences",
  );
  return data;
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const { data } = await api.put<NotificationPreferences>(
    "/api/v1/notifications/preferences",
    preferences,
  );
  return data;
}
