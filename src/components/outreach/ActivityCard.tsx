// external
import { useState } from "react";

// internal
import type { OutreachLog } from "../../services/outreachService";
import { formatLogTime, timeAgo } from "../../utils/outreachHelpers";

const COLLAPSED_COUNT = 6;

export default function ActivityCard({
  logs,
  emptyText = "No activity yet.",
}: {
  logs: OutreachLog[];
  emptyText?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? logs : logs.slice(0, COLLAPSED_COUNT);
  const hidden = logs.length - visible.length;

  return (
    <section className="card oc-card oc-slot-activity">
      <div className="oc-card-head">
        <h2 className="oc-card-title">Activity</h2>
        {logs.length > 0 && (
          <span className="text-muted text-small">{logs.length}</span>
        )}
      </div>

      {logs.length === 0 ? (
        <p className="text-muted text-small">{emptyText}</p>
      ) : (
        <>
          <ol className="oc-timeline">
            {visible.map((log) => (
              <li key={log.id}>
                <span className="oc-tl-dot" aria-hidden />
                <div className="oc-tl-msg">
                  <strong>{log.actorName}</strong> {log.message}
                </div>
                <time
                  className="text-muted text-small"
                  dateTime={log.createdAt}
                  title={formatLogTime(log.createdAt)}
                >
                  {timeAgo(log.createdAt)}
                </time>
              </li>
            ))}
          </ol>
          {(hidden > 0 || showAll) && logs.length > COLLAPSED_COUNT && (
            <button
              type="button"
              className="btn btn-ghost btn-sm oc-more"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show less" : `Show ${hidden} more`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
