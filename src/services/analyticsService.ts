import { api } from "./api";
import type { PagedResult } from "./types";

export interface HourlyPoint {
  hour: number;
  visitors: number;
  pageViews: number;
}

export interface TopPage {
  path: string;
  pageViews: number;
}

export interface RecentVisit {
  visitedAt: string;
  visitorId: string;
  path: string;
  referrer: string;
}

export interface AnalyticsSummary {
  date: string;
  visitors: number;
  pageViews: number;
  visitorsChangePct: number;
  pageViewsChangePct: number;
  series: HourlyPoint[];
  topPages: TopPage[];
  recentVisits: RecentVisit[];
  totalVisitsForDay: number;
}

export async function getSummary(date?: string): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>(
    "/api/v1/analytics/summary",
    { params: { date } },
  );
  return data;
}

export async function getRecentVisits(
  page = 1,
  pageSize = 5,
): Promise<PagedResult<RecentVisit>> {
  const { data } = await api.get<PagedResult<RecentVisit>>(
    "/api/v1/analytics/recent-visits",
    {
      params: { page, pageSize },
    },
  );
  return data;
}
