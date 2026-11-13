// external
import { useState } from "react";
import PhoneInput from "../PhoneInput";
import { formatPhone, phoneHref } from "../../utils/phone";
import { normalizeWebsite, websiteLabel } from "../../utils/outreachHelpers";
import { FiGlobe, FiMail, FiPhone } from "react-icons/fi";

// internal
import CopyButton from "./CopyButton";

export type ContactValues = {
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  website: string;
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
  const [websiteTouched, setWebsiteTouched] = useState(false);

  if (editing) {
    const websiteInvalid =
      websiteTouched &&
      values.website.trim() !== "" &&
      normalizeWebsite(values.website) === null;

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
            <PhoneInput
              id="oc-phone"
              value={values.phoneNumber}
              onChange={(v) => onChange("phoneNumber", v)}
              placeholder="Optional"
            />
          </div>
          <div className="field full">
            <label htmlFor="oc-website">Website</label>
            <input
              id="oc-website"
              type="text"
              inputMode="url"
              autoComplete="off"
              value={values.website}
              onChange={(e) => onChange("website", e.target.value)}
              onBlur={() => setWebsiteTouched(true)}
              placeholder="Optional, e.g. example.com"
              maxLength={300}
              aria-invalid={websiteInvalid}
            />
            {websiteInvalid && (
              <div className="field-error">
                Enter a valid website, like example.com.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const { contactName, email, phoneNumber } = values;
  const phoneLink = phoneHref(phoneNumber);
  const websiteUrl = normalizeWebsite(values.website);

  return (
    <section className="card oc-card oc-slot-contact">
      <div className="oc-card-head">
        <h2 className="oc-card-title">Contact</h2>
      </div>

      {(email || phoneNumber) && (
        <div className="oc-quick">
          {phoneNumber && (
            <a className="btn btn-ghost" href={`tel:${phoneLink}`}>
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
                <a href={`tel:${phoneLink}`} className="oc-link">
                  {formatPhone(phoneNumber)}
                </a>
                <CopyButton
                  value={formatPhone(phoneNumber)}
                  label="phone number"
                />
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="oc-fact">
          <dt>Website</dt>
          <dd>
            {websiteUrl ? (
              <>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="oc-link"
                >
                  <FiGlobe size={13} style={{ marginRight: 6 }} />
                  {websiteLabel(websiteUrl)}
                </a>
                <CopyButton value={websiteUrl} label="website" />
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
