// external
import { FiMail, FiPhone } from "react-icons/fi";

// internal
import CopyButton from "./CopyButton";

export type ContactValues = {
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
};

export default function ContactCard({
  editing,
  values,
  onChange,
}: {
  editing: boolean;
  values: ContactValues;
  onChange: (key: keyof ContactValues, value: string) => void;
}) {
  if (editing) {
    return (
      <section className="card oc-card oc-slot-contact">
        <div className="oc-card-head">
          <h2 className="oc-card-title">Company &amp; contact</h2>
        </div>
        <div className="oc-fields">
          <div className="field full">
            <label htmlFor="oc-name">Company name</label>
            <input
              id="oc-name"
              value={values.companyName}
              onChange={(e) => onChange("companyName", e.target.value)}
              placeholder="Who we're reaching out to"
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="field full">
            <label htmlFor="oc-contact">Contact</label>
            <input
              id="oc-contact"
              value={values.contactName}
              onChange={(e) => onChange("contactName", e.target.value)}
              placeholder="Person we would email, if we have a name, otherwise leave blank"
              maxLength={120}
            />
          </div>
          <div className="field">
            <label htmlFor="oc-email">Email</label>
            <input
              id="oc-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="Optional"
              maxLength={200}
            />
          </div>
          <div className="field">
            <label htmlFor="oc-phone">Phone number</label>
            <input
              id="oc-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={values.phoneNumber}
              onChange={(e) => onChange("phoneNumber", e.target.value)}
              placeholder="Optional"
              maxLength={30}
            />
          </div>
        </div>
      </section>
    );
  }

  const { contactName, email, phoneNumber } = values;
  const phoneHref = phoneNumber.replace(/[^\d+]/g, "");

  return (
    <section className="card oc-card oc-slot-contact">
      <div className="oc-card-head">
        <h2 className="oc-card-title">Contact</h2>
      </div>

      {(email || phoneNumber) && (
        <div className="oc-quick">
          {phoneNumber && (
            <a className="btn btn-ghost" href={`tel:${phoneHref}`}>
              <FiPhone size={16} /> Call
            </a>
          )}
          {email && (
            <a className="btn btn-ghost" href={`mailto:${email}`}>
              <FiMail size={16} /> Email
            </a>
          )}
        </div>
      )}

      <dl className="oc-facts">
        <div className="oc-fact">
          <dt>Contact person</dt>
          <dd>{contactName || "—"}</dd>
        </div>
        <div className="oc-fact">
          <dt>Email</dt>
          <dd>
            {email ? (
              <>
                <a href={`mailto:${email}`} className="oc-link">
                  {email}
                </a>
                <CopyButton value={email} label="email address" />
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="oc-fact">
          <dt>Phone</dt>
          <dd>
            {phoneNumber ? (
              <>
                <a href={`tel:${phoneHref}`} className="oc-link">
                  {phoneNumber}
                </a>
                <CopyButton value={phoneNumber} label="phone number" />
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
