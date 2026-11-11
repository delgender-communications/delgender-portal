// external
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiEdit2,
  FiMail,
  FiSend,
  FiSlash,
} from "react-icons/fi";

// internal
import { OutreachStatus } from "../../services/outreachService";
import type { OutreachDetail } from "../../services/outreachService";
import { findStatusLog, timeAgo } from "../../utils/outreachHelpers";

/**
 * The card at the top of the main column. What it says depends on where the
 * company is in the pipeline, so the next thing to do is always right there.
 */
export default function NextStepCard({
  company,
  editHref,
  editState,
  canSendFromSystem,
  acting,
  onRunEmail,
  markingReady,
  onMarkReady,
}: {
  company: OutreachDetail;
  editHref: string;
  editState: unknown;
  canSendFromSystem: boolean;
  acting: boolean;
  onRunEmail: (kind: "send" | "manual") => void;
  markingReady: boolean;
  onMarkReady: () => void;
}) {
  const [confirming, setConfirming] = useState<"send" | "manual" | null>(null);

  if (company.status === OutreachStatus.Ready) {
    return (
      <section
        id="oc-next"
        className="card oc-card oc-next oc-slot-next"
        aria-labelledby="oc-next-title"
      >
        <div className="oc-card-head">
          <h2 className="oc-card-title" id="oc-next-title">
            <FiSend size={16} aria-hidden /> Reach out
          </h2>
        </div>

        <p className="text-small" style={{ marginBottom: 6 }}>
          You can email the client yourself, then mark it as sent here so the
          rest of the team knows.
        </p>
        <p className="text-small" style={{ marginBottom: 16 }}>
          If you don't want to handle the email yourself, click{" "}
          <strong>Email the client</strong> and the system will send the pitch
          deck based on the information we found to the client for you. You
          don't have to do anything.
        </p>

        {confirming === null ? (
          <>
            <div className="oc-btn-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirming("manual")}
              >
                I've emailed them myself
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setConfirming("send")}
                disabled={!canSendFromSystem}
              >
                <FiMail size={15} /> Email the client
              </button>
            </div>
            {!canSendFromSystem && (
              <div className="field-hint" style={{ marginTop: 10 }}>
                To email from here, this company needs an email address and a
                pitch deck. Add them with{" "}
                <Link to={editHref} state={editState} className="oc-link">
                  Edit
                </Link>
                .
              </div>
            )}
          </>
        ) : (
          <div className="oc-confirm">
            <p className="text-small" style={{ marginBottom: 12 }}>
              {confirming === "send"
                ? `This will email ${company.email} with the pitch deck attached, and can't be undone. Send it?`
                : "This marks the company as Emailed without sending anything. Use it only after you've emailed them yourself."}
            </p>
            <div className="oc-btn-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setConfirming(null)}
                disabled={acting}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => onRunEmail(confirming)}
                disabled={acting}
              >
                {acting
                  ? confirming === "send"
                    ? "Sending…"
                    : "Saving…"
                  : confirming === "send"
                    ? "Yes, send it"
                    : "Yes, mark as emailed"}
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (company.status === OutreachStatus.Researching) {
    const hasDeck = Boolean(company.pitchDeckUrl);
    return (
      <section className="card oc-card oc-slot-next">
        <div className="oc-card-head">
          <h2 className="oc-card-title">
            <FiEdit2 size={16} aria-hidden /> Finish the research
          </h2>
        </div>
        <p className="text-small" style={{ marginBottom: 16 }}>
          Attach the pitch deck, and the findings report if you have one, then
          mark this company as Ready so anyone on the team can email it.
        </p>
        <div className="oc-btn-row">
          <Link className="btn btn-ghost" to={editHref} state={editState}>
            <FiEdit2 size={15} /> Edit company
          </Link>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onMarkReady}
            disabled={!hasDeck || markingReady}
          >
            {markingReady ? "Saving…" : "Mark as Ready"}
          </button>
        </div>
        {!hasDeck && (
          <div className="field-hint" style={{ marginTop: 10 }}>
            Upload a pitch deck first, then you can mark it as Ready.
          </div>
        )}
      </section>
    );
  }

  const log = findStatusLog(company.logs, company.status);

  if (company.status === OutreachStatus.Emailed) {
    return (
      <section className="card oc-card oc-next is-success oc-slot-next">
        <div className="oc-card-head">
          <h2 className="oc-card-title">
            <FiCheckCircle size={16} aria-hidden /> Outreach complete
          </h2>
        </div>
        <p className="text-small">
          {log ? (
            <>
              <strong>{log.actorName}</strong> {log.message}
            </>
          ) : (
            "Everything is done."
          )}
        </p>
        {log && (
          <p className="text-muted text-small" style={{ marginTop: 6 }}>
            {timeAgo(log.createdAt)}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="card oc-card oc-next is-muted oc-slot-next">
      <div className="oc-card-head">
        <h2 className="oc-card-title">
          <FiSlash size={16} aria-hidden /> Not being pursued
        </h2>
      </div>
      <p className="text-small">
        {log ? (
          <>
            <strong>{log.actorName}</strong> {log.message}
          </>
        ) : (
          "We decided not to pursue this company."
        )}
      </p>

      {/* Visible to everyone, so nobody has to ask why. */}
      <div className="oc-reason">
        <div className="oc-reason-label">Reason</div>
        {company.cancelReason ? (
          <p className="oc-reason-text">{company.cancelReason}</p>
        ) : (
          <p className="oc-reason-text is-empty">No reason was given.</p>
        )}
      </div>

      <div className="oc-btn-row" style={{ marginTop: 14 }}>
        <Link className="btn btn-ghost" to={editHref} state={editState}>
          <FiEdit2 size={15} /> Edit company
        </Link>
      </div>
    </section>
  );
}
