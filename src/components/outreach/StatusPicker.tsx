// internal
import { OUTREACH_STATUSES } from "../../services/outreachService";
import type { OutreachStatus } from "../../services/outreachService";

export default function StatusPicker({
  value,
  onChange,
}: {
  value: OutreachStatus;
  onChange: (status: OutreachStatus) => void;
}) {
  return (
    <section className="card oc-card oc-slot-next">
      <div className="oc-card-head">
        <h2 className="oc-card-title">Status</h2>
      </div>
      <div className="oc-status-grid" role="radiogroup" aria-label="Status">
        {OUTREACH_STATUSES.map((status) => {
          const active = status.value === value;
          return (
            <button
              key={status.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`oc-status-opt ${active ? "active" : ""}`}
              onClick={() => onChange(status.value)}
            >
              <span className={`badge ${status.badge}`}>{status.label}</span>
              <span className="oc-status-desc">{status.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
