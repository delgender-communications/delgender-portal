// external
import { useEffect, useState, type MouseEvent } from "react";
import { FiDownload, FiEdit2, FiPlus } from "react-icons/fi";

// internal
import * as outreachService from "../services/outreachService";
import { OUTREACH_STATUSES, OutreachStatus } from "../services/outreachService";
import type {
  OutreachDetail,
  OutreachListItem,
} from "../services/outreachService";
import OutreachFormModal, {
  type OutreachFormInitial,
} from "../components/OutreachFormModal";
import OutreachDetailsModal from "../components/OutreachDetailsModal";
import "./ListPage.css";
import "./OutreachPage.css";

const TABS: { label: string; value?: OutreachStatus }[] = [
  { label: "All" },
  ...OUTREACH_STATUSES.map((status) => ({
    label: status.label,
    value: status.value,
  })),
];

type RecommendedCompany = {
  id: string;
  companyName: string;
  email?: string | null;
  reason?: string | null;
};

// Filled later by the research agent. Left empty on purpose.
const RECOMMENDED: RecommendedCompany[] = [];

export default function OutreachPage() {
  const [tab, setTab] = useState(0);
  const [companies, setCompanies] = useState<OutreachListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState<OutreachFormInitial | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    outreachService
      .getOutreach(page, 15, TABS[tab].value)
      .then((res) => {
        setCompanies(res.data);
        setTotalPages(res.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const openCreate = (prefill?: RecommendedCompany) => {
    setCreating(true);
    setShowForm(
      prefill
        ? {
            companyName: prefill.companyName,
            email: prefill.email,
            status: OutreachStatus.Researching,
          }
        : { status: OutreachStatus.Researching },
    );
  };

  const openEdit = async (event: MouseEvent, id: number) => {
    event.stopPropagation();
    setError(null);
    try {
      const detail = await outreachService.getOutreachById(id);
      setCreating(false);
      setShowForm(detail);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't open that company.",
      );
    }
  };

  const handleDownload = async (
    event: MouseEvent,
    company: OutreachListItem,
  ) => {
    event.stopPropagation();
    setError(null);
    setDownloadingId(company.id);
    try {
      await outreachService.downloadPitchDeck(
        company.id,
        company.pitchDeckFileName,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't download that deck.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Outreach</h1>
          <p className="text-muted">
            Companies we want to work with. Research them, attach a pitch deck,
            then email it.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openCreate()}>
          <FiPlus size={16} /> Add company
        </button>
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <ul className="status-legend">
        {OUTREACH_STATUSES.map((status) => (
          <li key={status.value}>
            <span className={`badge ${status.badge}`}>{status.label}</span>
            <span>{status.description}</span>
          </li>
        ))}
      </ul>

      <section className="card outreach-recommended">
        <h2>Recommended</h2>
        <p className="text-muted text-small">Ready soon.</p>
        {RECOMMENDED.length === 0 ? (
          <div className="outreach-recommended-empty">
            Still a work in progress...
          </div>
        ) : (
          <ul className="outreach-recommended-list">
            {RECOMMENDED.map((company) => (
              <li key={company.id}>
                <div>
                  <strong>{company.companyName}</strong>
                  {company.email && (
                    <div className="text-muted text-small">{company.email}</div>
                  )}
                  {company.reason && (
                    <div className="text-muted text-small">
                      {company.reason}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => openCreate(company)}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pill-tabs" style={{ marginBottom: 20 }}>
        {TABS.map((item, index) => (
          <button
            key={item.label}
            className={`pill-tab ${tab === index ? "active" : ""}`}
            onClick={() => {
              setTab(index);
              setPage(1);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Pitch deck</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    Loading…
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No companies here yet.
                  </td>
                </tr>
              ) : (
                companies.map((company) => {
                  const status = OUTREACH_STATUSES.find(
                    (item) => item.value === company.status,
                  );
                  return (
                    <tr
                      key={company.id}
                      className="clickable"
                      onClick={() => setViewingId(company.id)}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {company.companyName}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <span
                            className={`badge ${status?.badge ?? "badge-draft"}`}
                          >
                            {status?.label ?? company.status}
                          </span>
                        </div>
                      </td>
                      <td>{company.contactName || "—"}</td>
                      <td className="text-muted">{company.email || "—"}</td>
                      <td>
                        {company.pitchDeckUrl ? (
                          <div className="deck-cell">
                            <span className="deck-name text-small">
                              {company.pitchDeckFileName || "Pitch deck"}
                            </span>
                            <button
                              className="btn btn-ghost btn-sm"
                              type="button"
                              disabled={downloadingId === company.id}
                              onClick={(event) =>
                                handleDownload(event, company)
                              }
                            >
                              <FiDownload size={14} />{" "}
                              {downloadingId === company.id
                                ? "Downloading…"
                                : "Download"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted text-small">No deck</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          onClick={(event) => openEdit(event, company.id)}
                        >
                          <FiEdit2 size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
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
      </div>

      {showForm && (
        <OutreachFormModal
          initial={creating ? showForm : (showForm as OutreachDetail)}
          onClose={() => {
            setShowForm(null);
            load();
          }}
          onSaved={() => {
            setShowForm(null);
            setDetailVersion((version) => version + 1);
            load();
          }}
        />
      )}

      {viewingId != null && (
        <OutreachDetailsModal
          key={`${viewingId}-${detailVersion}`}
          id={viewingId}
          onClose={() => setViewingId(null)}
          onChanged={load}
          onEdit={(detail) => {
            setCreating(false);
            setShowForm(detail);
          }}
        />
      )}
    </div>
  );
}
