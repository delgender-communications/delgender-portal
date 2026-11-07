// external
import { useEffect, useState, type MouseEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { FiDownload, FiEdit2, FiPlus } from "react-icons/fi";

// internal
import * as outreachService from "../services/outreachService";
import { OUTREACH_STATUSES } from "../services/outreachService";
import type {
  OutreachListItem,
  OutreachStatus,
} from "../services/outreachService";
import ResearchLeadsPanel from "../components/ResearchLeadsPanel";
import { TableSkeletonRows } from "../components/Skeleton";
import "./ListPage.css";
import "./OutreachPage.css";

const TABS: { label: string; value?: OutreachStatus }[] = [
  { label: "All" },
  ...OUTREACH_STATUSES.map((status) => ({
    label: status.label,
    value: status.value,
  })),
];

export default function OutreachPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  // Tab and page live in the address so coming back from a company lands on
  // the same list.
  const rawTab = Number(params.get("tab"));
  const tab =
    Number.isInteger(rawTab) && rawTab >= 0 && rawTab < TABS.length
      ? rawTab
      : 0;
  const page = Math.max(1, Math.floor(Number(params.get("page"))) || 1);

  const showList = (nextTab: number, nextPage: number) => {
    const next = new URLSearchParams();
    if (nextTab > 0) next.set("tab", String(nextTab));
    if (nextPage > 1) next.set("page", String(nextPage));
    setParams(next);
  };

  const [companies, setCompanies] = useState<OutreachListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
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

  const here = `${location.pathname}${location.search}`;

  const openCreate = () => navigate("/outreach/new", { state: { from: here } });

  const openCompany = (company: OutreachListItem) =>
    navigate(`/outreach/${company.id}`, {
      state: {
        from: here,
        preview: { companyName: company.companyName, status: company.status },
      },
    });

  const openEdit = (event: MouseEvent, company: OutreachListItem) => {
    event.stopPropagation();
    navigate(`/outreach/${company.id}/edit`, {
      state: {
        from: here,
        preview: { companyName: company.companyName, status: company.status },
      },
    });
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
        <button className="btn btn-primary" onClick={openCreate}>
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

      <ResearchLeadsPanel onAccepted={load} />

      <div className="pill-tabs" style={{ marginBottom: 20 }}>
        {TABS.map((item, index) => (
          <button
            key={item.label}
            className={`pill-tab ${tab === index ? "active" : ""}`}
            onClick={() => showList(index, 1)}
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
                <TableSkeletonRows
                  cells={["title", "text", "text", "text", "action"]}
                />
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
                      onClick={() => openCompany(company)}
                    >
                      <td>
                        <Link
                          className="row-link"
                          to={`/outreach/${company.id}`}
                          state={{
                            from: here,
                            preview: {
                              companyName: company.companyName,
                              status: company.status,
                            },
                          }}
                          onClick={(event) => event.stopPropagation()}
                          style={{ fontWeight: 600 }}
                        >
                          {company.companyName}
                        </Link>
                        <div style={{ marginTop: 6 }}>
                          <span
                            className={`badge ${status?.badge ?? "badge-draft"}`}
                          >
                            {status?.label ?? company.status}
                          </span>
                        </div>
                      </td>
                      <td data-label="Contact">{company.contactName || "—"}</td>
                      <td className="text-muted" data-label="Email">
                        {company.email || "—"}
                      </td>
                      <td data-label="Pitch deck">
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
                          onClick={(event) => openEdit(event, company)}
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
              onClick={() => showList(tab, page - 1)}
            >
              Previous
            </button>
            <span className="text-muted text-small">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages}
              onClick={() => showList(tab, page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
