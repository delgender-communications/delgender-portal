// external
import { FiCheck, FiSlash } from "react-icons/fi";

// internal
import {
  OUTREACH_STATUSES,
  OutreachStatus,
} from "../../services/outreachService";
import { PIPELINE } from "../../utils/outreachHelpers";

export default function PipelineStepper({
  status,
}: {
  status: OutreachStatus;
}) {
  if (status === OutreachStatus.Cancelled) {
    return (
      <div className="oc-cancelled-strip">
        <FiSlash size={15} aria-hidden /> Cancelled. We aren't pursuing this
        company.
      </div>
    );
  }

  const current = PIPELINE.indexOf(status);

  return (
    <ol className="oc-stepper" aria-label="Outreach progress">
      {PIPELINE.map((step, index) => {
        const meta = OUTREACH_STATUSES.find((item) => item.value === step);
        const done =
          index < current ||
          (status === OutreachStatus.Emailed && index === current);
        const active = index === current && !done;

        return (
          <li
            key={step}
            className={`oc-step ${done ? "done" : ""} ${active ? "current" : ""}`}
            aria-current={index === current ? "step" : undefined}
          >
            <span className="oc-step-dot">
              {done ? <FiCheck size={14} aria-hidden /> : index + 1}
            </span>
            <span className="oc-step-label">{meta?.label ?? step}</span>
          </li>
        );
      })}
    </ol>
  );
}
