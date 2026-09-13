// external
import { useEffect, useState, type ReactNode } from "react";
import { FiUsers, FiEye, FiArrowUp, FiArrowDown } from "react-icons/fi";

// internal
import * as analyticsService from "../services/analyticsService";
import type { AnalyticsSummary } from "../services/analyticsService";
import TrendChart from "../components/TrendChart";
import { pageLabel } from "../utils/pageLabels";
import { formatDateTime } from "../utils/format";
import "./DashboardPage.css";

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const [date, setDate] = useState(todayIso());
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    analyticsService
      .getSummary(date)
      .then(setSummary)
      .catch(() => setError("Couldn't load analytics right now."))
      .finally(() => setLoading(false));
  }, [date]);

  // regroup top pages by their friendly label - several raw paths can map to "Home"
  const groupedTopPages = summary
    ? Object.entries(
        summary.topPages.reduce<Record<string, number>>((acc, p) => {
          const label = pageLabel(p.path);
          acc[label] = (acc[label] ?? 0) + p.pageViews;
          return acc;
        }, {}),
      )
        .map(([label, pageViews]) => ({ label, pageViews }))
        .sort((a, b) => b.pageViews - a.pageViews)
    : [];

  const maxTopPage = Math.max(1, ...groupedTopPages.map((p) => p.pageViews));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Website Analytics</h1>
          <p className="text-muted">
            Track how visitors are using your website.
          </p>
        </div>
        <input
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          className="date-picker"
        />
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      {loading || !summary ? (
        <div className="centered-loader">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard
              icon={<FiUsers size={20} />}
              iconBg="rgba(59,130,246,0.15)"
              iconColor="#60a5fa"
              label="Visitors"
              value={summary.visitors.toLocaleString()}
              change={summary.visitorsChangePct}
            />
            <StatCard
              icon={<FiEye size={20} />}
              iconBg="rgba(167,139,250,0.15)"
              iconColor="#a78bfa"
              label="Page Views"
              value={summary.pageViews.toLocaleString()}
              change={summary.pageViewsChangePct}
            />
          </div>

          <div className="dashboard-grid">
            <div className="card">
              <div className="chart-header">
                <span className="card-title">Visitors &amp; Page Views</span>
                <div className="chart-legend">
                  <span>
                    <i style={{ background: "#60a5fa" }} /> Visitors
                  </span>
                  <span>
                    <i style={{ background: "#a78bfa" }} /> Page Views
                  </span>
                </div>
              </div>
              <TrendChart
                xLabels={summary.series.map(
                  (p) => `${p.hour.toString().padStart(2, "0")}:00`,
                )}
                series={[
                  {
                    label: "Visitors",
                    color: "#60a5fa",
                    values: summary.series.map((p) => p.visitors),
                  },
                  {
                    label: "Page Views",
                    color: "#a78bfa",
                    values: summary.series.map((p) => p.pageViews),
                  },
                ]}
              />
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: 18 }}>
                Pages Visited
              </div>
              {groupedTopPages.length === 0 ? (
                <p className="text-muted text-small">
                  No visits recorded for this day.
                </p>
              ) : (
                <div className="top-pages-list">
                  {groupedTopPages.map((p) => (
                    <div className="top-page-row" key={p.label}>
                      <div className="top-page-label">
                        <span>{p.label}</span>
                        <span className="text-muted">{p.pageViews}</span>
                      </div>
                      <div className="top-page-bar-track">
                        <div
                          className="top-page-bar-fill"
                          style={{
                            width: `${(p.pageViews / maxTopPage) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 22 }}>
            <div className="card-title" style={{ marginBottom: 6 }}>
              Recent Visits
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Page Visited</th>
                    <th>Referrer</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentVisits.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-row">
                        No visits recorded for this day yet.
                      </td>
                    </tr>
                  ) : (
                    summary.recentVisits.map((v, i) => (
                      <tr key={i}>
                        <td className="text-muted">
                          {formatDateTime(v.visitedAt)}
                        </td>
                        <td>{pageLabel(v.path)}</td>
                        <td className="text-muted">{v.referrer}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-muted text-small" style={{ marginTop: 14 }}>
              Showing {summary.recentVisits.length} of{" "}
              {summary.totalVisitsForDay} visits today
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  change,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  change: number;
}) {
  const positive = change >= 0;
  return (
    <div className="card stat-card">
      <div
        className="stat-icon"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${positive ? "positive" : "negative"}`}>
          {positive ? <FiArrowUp size={13} /> : <FiArrowDown size={13} />}
          {Math.abs(change).toFixed(0)}% vs. previous day
        </div>
      </div>
    </div>
  );
}
