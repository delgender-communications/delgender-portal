// external
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

// internal
import * as researchLeadService from "../services/researchLeadService";
import {
  ResearchLeadStatus,
  caseLabel,
  researchChecklist,
  safeWebUrl,
} from "../services/researchLeadService";
import type {
  ResearchLead,
  ResearchLeadCounts,
} from "../services/researchLeadService";
import ResearchLeadFormModal from "./ResearchLeadFormModal";
import { Skeleton, SkeletonLabel } from "./Skeleton";

const PAGE_SIZE = 5;

type Tab = "recommended" | "research";

export default function ResearchLeadsPanel({
  onAccepted,
}: {
  onAccepted: () => void;
}) {
  const [leads, setLeads] = useState<ResearchLead[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<Tab>("recommended");
  const [counts, setCounts] = useState<ResearchLeadCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    researchLeadService
      .getResearchLeadCounts()
      .then((res) => {
        if (!cancelled) setCounts(res);
      })
      .catch(() => {
        // The tab badges are a nice-to-have, so a failure here stays quiet.
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  useEffect(() => {
    let cancelled = false;
    researchLeadService
      .getResearchLeads(
        page,
        PAGE_SIZE,
        ResearchLeadStatus.New,
        tab === "research",
      )
      .then((res) => {
        if (cancelled) return;
        // The last lead on a page was just handled, so step back one page.
        if (res.data.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setLeads(res.data);
        setTotalPages(res.totalPages || 1);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the recommended leads.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, version, tab]);

  const refresh = () => setVersion((current) => current + 1);

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setPage(1);
    setLeads([]);
    setTotalPages(1);
    setLoading(true);
    setError(null);
    setDismissingId(null);
    setReason("");
  };

  const handleAccept = async (lead: ResearchLead) => {
    setBusyId(lead.id);
    setError(null);
    try {
      await researchLeadService.acceptResearchLead(lead.id);
      refresh();
      onAccepted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't accept that lead.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = async (lead: ResearchLead) => {
    setBusyId(lead.id);
    setError(null);
    try {
      await researchLeadService.dismissResearchLead(
        lead.id,
        reason.trim() || null,
      );
      setDismissingId(null);
      setReason("");
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't dismiss that lead.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card outreach-recommended">
      <div className="lead-header">
        <div>
          <h2>
            Leads{" "}
            {counts && counts.count > 0 && (
              <span className="badge badge-pending">{counts.count} new</span>
            )}
          </h2>
          <p className="text-muted text-small">
            {tab === "recommended"
              ? "Companies the research agent thinks we could help. Review each one, then add it to outreach or dismiss it."
              : "Companies the agent couldn't fully judge, or that scored low but look worth a look. Follow the links to see what you find, then add them to outreach or dismiss them."}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => setShowForm(true)}
        >
          <FiPlus size={14} /> Add lead by hand
        </button>
      </div>

      <div className="lead-tabs" role="tablist">
        {(
          [
            ["recommended", "Recommended", counts?.recommended],
            ["research", "Needs research", counts?.needsResearch],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={`lead-tab${tab === value ? " active" : ""}`}
            onClick={() => switchTab(value)}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="lead-tab-count">{count}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="form-error-banner" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}

      {loading && leads.length === 0 ? (
        <ul className="lead-list">
          <SkeletonLabel text="Loading leads" />
          {[0, 1, 2].map((i) => (
            <li key={i} className="lead-item">
              <div className="lead-main" style={{ flex: 1, gap: 8 }}>
                <div className="skeleton-inline">
                  <Skeleton width={150} height={15} />
                  <Skeleton width={64} height={22} radius={999} />
                </div>
                <Skeleton width="60%" height={12} />
              </div>
              <Skeleton width={96} height={30} radius={8} />
            </li>
          ))}
        </ul>
      ) : leads.length === 0 ? (
        <div className="outreach-recommended-empty">
          {tab === "recommended"
            ? "No new leads right now. New ones show up here when the research agent finds them."
            : "Nothing to research right now. Companies the agent couldn't fully judge show up here."}
        </div>
      ) : (
        <ul className="lead-list">
          {leads.map((lead) => {
            const website = safeWebUrl(lead.website);
            const busy = busyId === lead.id;
            const meta = [lead.industry, lead.location]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={lead.id} className="lead-item">
                <div className="lead-main">
                  <div className="lead-title">
                    <strong>{lead.companyName}</strong>
                    <span className="badge badge-draft">
                      {caseLabel(lead.case)}
                    </span>
                    {lead.needsResearch && (
                      <span className="badge badge-pending">
                        Needs research
                      </span>
                    )}
                    {lead.siteStack && (
                      <span
                        className="lead-chip"
                        title="What their site is built with"
                      >
                        {lead.siteStack}
                      </span>
                    )}
                    {lead.score != null && (
                      <span className="text-muted text-small">
                        Score {lead.score}
                      </span>
                    )}
                  </div>

                  {meta && <div className="text-muted text-small">{meta}</div>}

                  {lead.website && (
                    <div className="text-small">
                      {website ? (
                        <a href={website} target="_blank" rel="noreferrer">
                          {lead.website}
                        </a>
                      ) : (
                        lead.website
                      )}
                    </div>
                  )}

                  {lead.summary && (
                    <p className="lead-summary">{lead.summary}</p>
                  )}

                  {lead.needsResearch && (
                    <div className="lead-research">
                      {lead.researchReason && (
                        <p className="lead-reason text-small">
                          <strong>What to check:</strong> {lead.researchReason}
                        </p>
                      )}
                      <div className="lead-checklist text-small">
                        <span className="text-muted">Look into it:</span>
                        {researchChecklist(lead).map((link) => (
                          <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.evidence.length > 0 && (
                    <details className="lead-evidence">
                      <summary className="text-small">
                        Evidence ({lead.evidence.length})
                      </summary>
                      <ul>
                        {lead.evidence.map((item, index) => {
                          const source = safeWebUrl(item.sourceUrl);
                          return (
                            <li key={index} className="text-small">
                              {item.finding}
                              {source && (
                                <>
                                  {" "}
                                  <a
                                    href={source}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Source
                                  </a>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  )}

                  <div className="text-muted text-small">
                    Found by {lead.foundBy} on{" "}
                    {new Date(lead.createdAt).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="lead-actions">
                  {dismissingId === lead.id ? (
                    <div className="lead-dismiss">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why not? (optional)"
                        maxLength={500}
                        autoFocus
                      />
                      <div className="lead-dismiss-buttons">
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setDismissingId(null);
                            setReason("");
                          }}
                        >
                          Back
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          disabled={busy}
                          onClick={() => handleDismiss(lead)}
                        >
                          {busy ? "Dismissing…" : "Dismiss"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn btn-ghost btn-sm"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setDismissingId(lead.id);
                          setReason("");
                        }}
                      >
                        Dismiss
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        disabled={busy}
                        onClick={() => handleAccept(lead)}
                      >
                        {busy ? "Adding…" : "Add to outreach"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: 14 }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span className="text-muted text-small">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <ResearchLeadFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}
    </section>
  );
}
