// external
import { useRef } from "react";

// internal
import {
  OUTREACH_STATUSES,
  OutreachStatus,
} from "../../services/outreachService";

const MAX_REASON = 200;

export default function StatusPicker({
  value,
  onChange,
  reason,
  onReasonChange,
  reasonRequired,
}: {
  value: OutreachStatus;
  onChange: (status: OutreachStatus) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  reasonRequired: boolean;
}) {
  const reasonInput = useRef<HTMLInputElement>(null);

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
              onClick={() => {
                onChange(status.value);
                if (
                  status.value === OutreachStatus.Cancelled &&
                  value !== OutreachStatus.Cancelled
                ) {
                  window.setTimeout(() => reasonInput.current?.focus(), 0);
                }
              }}
            >
              <span className={`badge ${status.badge}`}>{status.label}</span>
              <span className="oc-status-desc">{status.description}</span>
            </button>
          );
        })}
      </div>

      {value === OutreachStatus.Cancelled && (
        <div className="field oc-reason-field">
          <label htmlFor="oc-cancel-reason">
            Reason for cancelling{reasonRequired ? " *" : ""}
          </label>
          <input
            id="oc-cancel-reason"
            ref={reasonInput}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            maxLength={MAX_REASON}
            placeholder="A short reason, e.g. not a fit for our services"
            autoComplete="off"
          />
          <div className="oc-reason-hint text-small text-muted">
            <span>Everyone on the team sees this on the company's page.</span>
            <span>
              {reason.length}/{MAX_REASON}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
