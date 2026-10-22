import { api, extractErrorMessage } from "./api";
import type { PagedResult } from "./types";

export const ResearchLeadStatus = {
  New: "New",
  Accepted: "Accepted",
  Dismissed: "Dismissed",
} as const;
export type ResearchLeadStatus =
  (typeof ResearchLeadStatus)[keyof typeof ResearchLeadStatus];

export const ResearchLeadCase = {
  StrugglingPr: "StrugglingPr",
  WeakSocialPresence: "WeakSocialPresence",
  NoWebsite: "NoWebsite",
  OutdatedWebsite: "OutdatedWebsite",
  Other: "Other",
} as const;
export type ResearchLeadCase =
  (typeof ResearchLeadCase)[keyof typeof ResearchLeadCase];

export const RESEARCH_LEAD_CASES: { value: ResearchLeadCase; label: string }[] =
  [
    { value: ResearchLeadCase.StrugglingPr, label: "Struggling PR" },
    {
      value: ResearchLeadCase.WeakSocialPresence,
      label: "Weak social media presence",
    },
    { value: ResearchLeadCase.NoWebsite, label: "No website" },
    { value: ResearchLeadCase.OutdatedWebsite, label: "Outdated website" },
    { value: ResearchLeadCase.Other, label: "Other" },
  ];

export type ResearchLeadEvidence = {
  finding: string;
  sourceUrl?: string | null;
};

export type ResearchLead = {
  id: number;
  companyName: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  case: ResearchLeadCase;
  score?: number | null;
  summary?: string | null;
  status: ResearchLeadStatus;
  dismissReason?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  outreachCompanyId?: number | null;
  foundBy: string;
  createdAt: string;
  evidence: ResearchLeadEvidence[];
};

export type ResearchLeadInput = {
  companyName: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  case: ResearchLeadCase;
  summary?: string | null;
};

// Links come from the research agent, so only ever turn real web addresses
// into clickable links.
export function safeWebUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function caseLabel(value: ResearchLeadCase): string {
  return (
    RESEARCH_LEAD_CASES.find((item) => item.value === value)?.label ?? value
  );
}

export async function getResearchLeads(
  page = 1,
  pageSize = 5,
  status?: ResearchLeadStatus,
): Promise<PagedResult<ResearchLead>> {
  const { data } = await api.get<PagedResult<ResearchLead>>(
    "/api/v1/research-leads",
    { params: { page, pageSize, status } },
  );
  return data;
}

export async function addResearchLead(
  input: ResearchLeadInput,
): Promise<ResearchLead> {
  try {
    const { data } = await api.post<ResearchLead>(
      "/api/v1/research-leads",
      input,
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't add that lead."), {
      cause: error,
    });
  }
}

export async function acceptResearchLead(id: number): Promise<ResearchLead> {
  try {
    const { data } = await api.post<ResearchLead>(
      `/api/v1/research-leads/${id}/accept`,
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't accept that lead."), {
      cause: error,
    });
  }
}

export async function dismissResearchLead(
  id: number,
  reason: string | null,
): Promise<ResearchLead> {
  try {
    const { data } = await api.post<ResearchLead>(
      `/api/v1/research-leads/${id}/dismiss`,
      { reason },
    );
    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Couldn't dismiss that lead."), {
      cause: error,
    });
  }
}
