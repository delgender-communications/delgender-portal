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
  LowVisibility: "LowVisibility",
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
    { value: ResearchLeadCase.LowVisibility, label: "Low online visibility" },
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
  // Set by the agent for companies a person should look into before deciding.
  needsResearch: boolean;
  researchReason?: string | null;
  // What the site is built with, for example "Next.js · Vercel · JS-rendered".
  siteStack?: string | null;
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
  needsResearch?: boolean,
): Promise<PagedResult<ResearchLead>> {
  const { data } = await api.get<PagedResult<ResearchLead>>(
    "/api/v1/research-leads",
    { params: { page, pageSize, status, needsResearch } },
  );
  return data;
}

export type ResearchLeadCounts = {
  count: number;
  recommended: number;
  needsResearch: number;
};

// How many new leads each list holds, for the tab badges.
export async function getResearchLeadCounts(): Promise<ResearchLeadCounts> {
  const { data } = await api.get<ResearchLeadCounts>(
    "/api/v1/research-leads/new-count",
  );
  return data;
}

export type ResearchLink = { label: string; url: string };

const googleSearch = (query: string, extra = "") =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}${extra}`;

// Links a person can follow to look into a company the agent couldn't fully
// judge. Built from the name and website, so nothing here depends on the agent.
export function researchChecklist(lead: ResearchLead): ResearchLink[] {
  const name = lead.companyName;
  const quoted = `"${name}"`;
  const links: ResearchLink[] = [];

  const website = safeWebUrl(lead.website);
  if (website) {
    links.push({ label: "Open their site", url: website });
    try {
      const host = new URL(website).hostname;
      links.push({
        label: "Their news or blog",
        url: googleSearch(`site:${host} news OR blog OR press`),
      });
    } catch {
      // Not a usable address, so skip the site-specific link.
    }
  }

  links.push(
    {
      label: "LinkedIn",
      url: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(name)}`,
    },
    {
      label: "Instagram / Facebook",
      url: googleSearch(`${quoted} instagram OR facebook`),
    },
    { label: "Recent news", url: googleSearch(quoted, "&tbm=nws") },
    {
      label: "Funding or launches",
      url: googleSearch(`${quoted} funding OR launch OR partnership OR award`),
    },
  );

  return links;
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
