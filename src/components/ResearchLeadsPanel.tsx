// external
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

// internal
import * as researchLeadService from "../services/researchLeadService";
import {
  ResearchLeadStatus,
  caseLabel,
  safeWebUrl,
} from "../services/researchLeadService";
import type { ResearchLead } from "../services/researchLeadService";
import ResearchLeadFormModal from "./ResearchLeadFormModal";

const PAGE_SIZE = 5;

export default function ResearchLeadsPanel({
  onAccepted,
}: {
  onAccepted: () => void;
}) {
  const [leads, setLeads] = useState<ResearchLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    researchLeadService
      .getResearchLeads(page, PAGE_SIZE, ResearchLeadStatus.New)
      .then((res) => {
        if (cancelled) return;
        // The last lead on a page was just handled, so step back one page.
        if (res.data.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }
        setLeads(res.data);
        setTotal(res.totalCount);
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
  }, [page, version]);

  const refresh = () => setVersion((current) => current + 1);

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
            Recommended{" "}
            {total > 0 && (
              <span className="badge badge-pending">{total} new</span>
            )}
          </h2>
          <p className="text-muted text-small">
            Companies the research agent thinks we could help. Review each one,
            then add it to outreach or dismiss it.
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

      {error && (
        <div className="form-error-banner" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}

      {loading && leads.length === 0 ? (
        <div className="outreach-recommended-empty">Loading…</div>
      ) : leads.length === 0 ? (
        <div className="outreach-recommended-empty">
          No new leads right now. New ones show up here when the research agent
          finds them.
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
