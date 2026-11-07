// internal
import { OutreachStatus } from "../services/outreachService";
import type {
  OutreachDetail,
  OutreachInput,
  OutreachLog,
} from "../services/outreachService";
import { formatDate } from "./format";

/** The happy path a company moves along. Cancelled sits outside it. */
export const PIPELINE: OutreachStatus[] = [
  OutreachStatus.Researching,
  OutreachStatus.Ready,
  OutreachStatus.Emailed,
];

export function timeAgo(value: string): string {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatDate(value);
}

export function formatLogTime(value: string): string {
  return new Date(value).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LOG_PATTERNS: Partial<Record<OutreachStatus, RegExp>> = {
  [OutreachStatus.Emailed]:
    /^(emailed the pitch deck|marked this as Emailed|changed the status from .+ to Emailed|added this company as Emailed)/,
  [OutreachStatus.Cancelled]:
    /^(changed the status from .+ to Cancelled|added this company as Cancelled)/,
};

/** The most recent activity entry that put the company into this status. */
export function findStatusLog(
  logs: OutreachLog[],
  status: OutreachStatus,
): OutreachLog | undefined {
  const pattern = STATUS_LOG_PATTERNS[status];
  return pattern ? logs.find((log) => pattern.test(log.message)) : undefined;
}

export function fileKind(name: string): { badge: string; tone: string } {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return { badge: "PDF", tone: "is-pdf" };
  if (lower.endsWith(".docx")) return { badge: "DOCX", tone: "is-docx" };
  if (lower.endsWith(".txt")) return { badge: "TXT", tone: "is-txt" };
  return { badge: "FILE", tone: "" };
}

export function toInput(
  company: OutreachDetail,
  overrides: Partial<OutreachInput> = {},
): OutreachInput {
  return {
    companyName: company.companyName,
    contactName: company.contactName ?? null,
    email: company.email ?? null,
    phoneNumber: company.phoneNumber ?? null,
    notes: company.notes ?? null,
    status: company.status,
    ...overrides,
  };
}

/**
 * Only the details call returns the research. Every other call (save, upload,
 * email) leaves it out, so carry it over instead of losing it.
 */
export function mergeDetail(
  previous: OutreachDetail | null,
  next: OutreachDetail,
): OutreachDetail {
  return { ...next, research: next.research ?? previous?.research ?? null };
}
