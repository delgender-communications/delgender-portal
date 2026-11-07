// external
import { FiExternalLink } from "react-icons/fi";

// internal
import { caseLabel, safeWebUrl } from "../../services/researchLeadService";
import type { OutreachResearch } from "../../services/outreachService";
import { formatDate } from "../../utils/format";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ResearchCard({
  research,
}: {
  research: OutreachResearch;
}) {
  const website = safeWebUrl(research.website);
  const score =
    research.score == null ? null : Math.min(100, Math.max(0, research.score));

  return (
    <section className="card oc-card oc-slot-research">
      <div className="oc-card-head">
        <h2 className="oc-card-title">What we found</h2>
        <span className="badge badge-pending">{caseLabel(research.case)}</span>
      </div>

      {score != null && (
        <div className="oc-score">
          <div className="oc-score-top">
            <span>Lead score</span>
            <strong>{score}/100</strong>
          </div>
          <div
            className="oc-score-track"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            aria-label="Lead score"
          >
            <div className="oc-score-fill" style={{ width: `${score}%` }} />
          </div>
        </div>
      )}

      {research.summary && <p className="oc-summary">{research.summary}</p>}

      {(research.website || research.industry || research.location) && (
        <dl className="oc-facts">
          {research.website && (
            <div className="oc-fact">
              <dt>Website</dt>
              <dd>
                {website ? (
                  <a
                    className="oc-link"
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {hostOf(website)} <FiExternalLink size={13} aria-hidden />
                  </a>
                ) : (
                  research.website
                )}
              </dd>
            </div>
          )}
          {research.industry && (
            <div className="oc-fact">
              <dt>Industry</dt>
              <dd>{research.industry}</dd>
            </div>
          )}
          {research.location && (
            <div className="oc-fact">
              <dt>Location</dt>
              <dd>{research.location}</dd>
            </div>
          )}
        </dl>
      )}

      {research.evidence.length > 0 && (
        <div className="oc-evidence-block">
          <div className="detail-label">Evidence</div>
          <ul className="oc-evidence">
            {research.evidence.map((item, index) => {
              const source = safeWebUrl(item.sourceUrl);
              return (
                <li key={index}>
                  <span>{item.finding}</span>
                  {source && (
                    <a
                      className="oc-link oc-evidence-src"
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {hostOf(source)} <FiExternalLink size={12} aria-hidden />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="oc-foot">
        Found by {research.foundBy} · {formatDate(research.foundAt)}
      </p>
    </section>
  );
}
