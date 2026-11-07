// external
import { FiCheck, FiMinus } from "react-icons/fi";

export type ReadinessInput = {
  hasEmail: boolean;
  hasDeck: boolean;
  hasReport: boolean;
  isReady: boolean;
};

export default function ReadinessCard({ input }: { input: ReadinessInput }) {
  const items = [
    { label: "Email address added", ok: input.hasEmail },
    { label: "Pitch deck attached", ok: input.hasDeck },
    { label: "Status set to Ready", ok: input.isReady },
    { label: "Findings report", ok: input.hasReport, optional: true },
  ];

  const required = items.filter((item) => !item.optional);
  const done = required.filter((item) => item.ok).length;
  const complete = done === required.length;

  return (
    <section className="card oc-card oc-slot-readiness">
      <div className="oc-card-head">
        <h2 className="oc-card-title">Ready to email?</h2>
        <span className={`oc-progress-count ${complete ? "complete" : ""}`}>
          {done} of {required.length}
        </span>
      </div>

      <div className="oc-progress" aria-hidden>
        <div
          className="oc-progress-fill"
          style={{ width: `${(done / required.length) * 100}%` }}
        />
      </div>

      <ul className="oc-checklist">
        {items.map((item) => (
          <li key={item.label} className={item.ok ? "ok" : ""}>
            <span className="oc-check" aria-hidden>
              {item.ok ? <FiCheck size={13} /> : <FiMinus size={13} />}
            </span>
            <span>
              {item.label}
              {item.optional && <span className="text-muted"> (optional)</span>}
            </span>
            <span className="skeleton-sr">{item.ok ? "done" : "not done"}</span>
          </li>
        ))}
      </ul>

      <p className="oc-foot" style={{ marginTop: 14 }}>
        {complete
          ? "Everything's in place. This company can be emailed."
          : "Finish the unchecked items before this company can be emailed from the system."}
      </p>
    </section>
  );
}
