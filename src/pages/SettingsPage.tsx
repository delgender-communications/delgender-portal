// external
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  FiBell,
  FiCamera,
  FiCheck,
  FiChevronDown,
  FiHelpCircle,
  FiLock,
  FiMonitor,
  FiShield,
  FiSmartphone,
  FiTablet,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";

// internal
import { useAuth } from "../context/AuthContext";
import * as authService from "../services/authService";
import type { TrustedDevice } from "../services/authService";
import * as staffService from "../services/staffService";
import {
  ChangeRequestType,
  changeRequestLabel,
  type ChangeRequest,
} from "../services/staffService";
import * as notificationService from "../services/notificationService";
import type { NotificationPreferences } from "../services/notificationService";
import { initials, formatDate, formatDateTime } from "../utils/format";
import { formatPhone } from "../utils/phone";
import PhoneInput from "../components/PhoneInput";
import { Skeleton, SkeletonLabel } from "../components/Skeleton";
import "./ListPage.css";
import "./DashboardPage.css";
import "./SettingsPage.css";

function deviceIcon(label?: string | null) {
  const text = (label ?? "").toLowerCase();
  if (text.includes("iphone") || text.includes("android")) {
    return <FiSmartphone size={18} />;
  }
  if (text.includes("ipad") || text.includes("tablet")) {
    return <FiTablet size={18} />;
  }
  if (
    text.includes("mac") ||
    text.includes("windows") ||
    text.includes("linux")
  ) {
    return <FiMonitor size={18} />;
  }
  return <FiHelpCircle size={18} />;
}

// ---------- accordion ----------

function Section({
  id,
  icon,
  title,
  description,
  open,
  onToggle,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={`settings-section${open ? " open" : ""}`}>
      <button
        type="button"
        className="settings-section-head"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
      >
        <span className="settings-section-icon">{icon}</span>
        <span className="settings-section-text">
          <span className="settings-section-title">{title}</span>
          <span className="settings-section-desc">{description}</span>
        </span>
        <FiChevronDown className="settings-section-chevron" size={18} />
      </button>

      {/* Closed panels stay out of the tab order and away from screen readers. */}
      <div
        id={`${id}-panel`}
        className="settings-section-body"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="settings-section-inner">{children}</div>
      </div>
    </section>
  );
}

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`switch${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-knob" />
    </button>
  );
}

// ---------- page ----------

type SectionId = "account" | "security" | "preferences";

export default function SettingsPage() {
  const { staff, refreshStaff, logout } = useAuth();

  const [openSections, setOpenSections] = useState<SectionId[]>([]);
  const toggleSection = (id: SectionId) =>
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  // profile picture
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // account information: change requests
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [editing, setEditing] = useState<ChangeRequestType | null>(null);
  const [nameForm, setNameForm] = useState({ name: "", surname: "" });
  const [valueForm, setValueForm] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  // preferences
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    authService
      .getTrustedDevices()
      .then(setDevices)
      .finally(() => setDevicesLoading(false));

    staffService
      .getMyChangeRequests()
      .then(setRequests)
      .catch(() => {
        // The section still works without the history.
      });

    notificationService
      .getNotificationPreferences()
      .then(setPrefs)
      .catch(() => setPrefsError("Couldn't load your preferences."));

    // An admin may have approved a change since this was last loaded.
    void refreshStaff();
  }, [refreshStaff]);

  if (!staff) return null;

  // ---------- profile picture ----------

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      await staffService.uploadMyProfilePicture(file);
      await refreshStaff();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Couldn't upload that picture.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  // ---------- change requests ----------

  const pendingFor = (type: ChangeRequestType) =>
    requests.find((r) => r.type === type && r.status === "Pending");

  const startEditing = (type: ChangeRequestType) => {
    setRequestError(null);
    setRequestNotice(null);
    setEditing(type);
    if (type === ChangeRequestType.Name) {
      setNameForm({ name: staff.name, surname: staff.surname });
    } else {
      setValueForm("");
    }
  };

  const stopEditing = () => {
    setEditing(null);
    setRequestError(null);
  };

  const sendRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    setSending(true);
    setRequestError(null);
    try {
      await staffService.requestChange(
        editing === ChangeRequestType.Name
          ? {
              type: editing,
              newValue: nameForm.name,
              newSurname: nameForm.surname,
            }
          : { type: editing, newValue: valueForm },
      );
      setRequests(await staffService.getMyChangeRequests());
      setRequestNotice(
        `Your ${changeRequestLabel(editing)} change was sent. An admin will review it.`,
      );
      setEditing(null);
    } catch (err) {
      setRequestError(
        err instanceof Error ? err.message : "Couldn't send that request.",
      );
    } finally {
      setSending(false);
    }
  };

  const cancelRequest = async (request: ChangeRequest) => {
    setRequestError(null);
    setRequestNotice(null);
    try {
      await staffService.cancelChangeRequest(request.id);
      setRequests(await staffService.getMyChangeRequests());
    } catch (err) {
      setRequestError(
        err instanceof Error ? err.message : "Couldn't cancel that request.",
      );
    }
  };

  const decided = requests
    .filter((r) => r.status === "Approved" || r.status === "Rejected")
    .slice(0, 4);

  // One row: what it is now, and a way to ask for a change.
  const renderRow = (
    type: ChangeRequestType,
    label: string,
    value: string,
    form: ReactNode,
  ) => {
    const pending = pendingFor(type);
    const isEditing = editing === type;

    return (
      <div className="info-row">
        <div className="info-row-main">
          <div className="info-label">{label}</div>
          <div className="info-value">{value}</div>
        </div>

        {pending ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => cancelRequest(pending)}
          >
            Cancel request
          </button>
        ) : (
          !isEditing && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => startEditing(type)}
            >
              Request change
            </button>
          )
        )}

        {pending && (
          <div className="info-pending">
            <span className="pill pill-pending">Waiting for approval</span>
            <span className="text-small text-muted">
              Asked to change to{" "}
              <strong>
                {type === ChangeRequestType.PhoneNumber
                  ? formatPhone(pending.to)
                  : pending.to}
              </strong>
            </span>
          </div>
        )}

        {isEditing && (
          <form className="info-form" onSubmit={sendRequest}>
            {form}
            {requestError && (
              <div className="form-error-banner">{requestError}</div>
            )}
            <div className="info-form-actions">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={sending}
              >
                {sending ? "Sending…" : "Send request"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={stopEditing}
              >
                Cancel
              </button>
            </div>
            <p className="text-small text-muted">
              An admin has to approve this before it changes.
            </p>
          </form>
        )}
      </div>
    );
  };

  // ---------- password and devices ----------

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords don't match.");
      return;
    }

    setPwLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(
        err instanceof Error ? err.message : "Couldn't change your password.",
      );
    } finally {
      setPwLoading(false);
    }
  };

  const handleRevoke = async (device: TrustedDevice) => {
    await authService.revokeTrustedDevice(device.id);
    if (device.isCurrent) {
      authService.forgetThisDevice();
      await logout();
      return;
    }
    setDevices((prev) => prev.filter((d) => d.id !== device.id));
  };

  // ---------- preferences ----------

  const setPref = async (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    if (!prefs) return;

    const before = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next); // shows straight away
    setPrefsError(null);
    setPrefsSaved(false);

    try {
      setPrefs(await notificationService.updateNotificationPreferences(next));
      setPrefsSaved(true);
    } catch {
      setPrefs(before);
      setPrefsError("Couldn't save that. Try again.");
    }
  };

  const prefRows: {
    key: keyof NotificationPreferences;
    title: string;
    description: string;
  }[] = [
    {
      key: "notifyNewLeads",
      title: "New leads",
      description: "When the research agent adds new leads to the portal.",
    },
    {
      key: "notifyNewBookings",
      title: "New bookings",
      description: "Each time a client makes a booking.",
    },
    {
      key: "notifyOverdueInvoices",
      title: "Overdue invoices",
      description: "When an invoice passes its due date unpaid.",
    },
  ];

  return (
    <div className="settings-page">
      {/* ---------- profile picture, top left ---------- */}
      <div className="settings-hero">
        <div className="settings-eyebrow">Settings</div>

        <button
          type="button"
          className="hero-avatar"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          aria-label="Change profile picture"
        >
          <span className="avatar hero-avatar-img">
            {staff.profilePictureUrl ? (
              <img src={staff.profilePictureUrl} alt="" />
            ) : (
              initials(staff.name, staff.surname)
            )}
          </span>
          <span className="hero-avatar-edit">
            <FiCamera size={30} />
          </span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />

        <div className="hero-name">
          {staff.name} {staff.surname}
        </div>
        <div className="text-muted text-small">
          {staff.jobTitle} · {staff.role}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Change picture"}
        </button>
        {uploadError && <div className="form-error-banner">{uploadError}</div>}
      </div>

      {/* ---------- the list ---------- */}
      <div className="settings-list">
        <Section
          id="account"
          icon={<FiUser size={18} />}
          title="Account information"
          description="Your name, staff ID, email and phone number. Changes need an admin's approval."
          open={openSections.includes("account")}
          onToggle={() => toggleSection("account")}
        >
          {requestNotice && (
            <div className="notice-banner">
              <FiCheck size={15} /> {requestNotice}
            </div>
          )}
          {requestError && editing === null && (
            <div className="form-error-banner">{requestError}</div>
          )}

          {renderRow(
            ChangeRequestType.Name,
            "Name",
            `${staff.name} ${staff.surname}`,
            <div className="info-form-grid">
              <div className="field">
                <label htmlFor="req-name">First name</label>
                <input
                  id="req-name"
                  value={nameForm.name}
                  onChange={(e) =>
                    setNameForm((f) => ({ ...f, name: e.target.value }))
                  }
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="req-surname">Surname</label>
                <input
                  id="req-surname"
                  value={nameForm.surname}
                  onChange={(e) =>
                    setNameForm((f) => ({ ...f, surname: e.target.value }))
                  }
                  maxLength={100}
                  required
                />
              </div>
            </div>,
          )}

          <div className="info-row">
            <div className="info-row-main">
              <div className="info-label">Staff ID</div>
              <div className="info-value">{staff.staffId}</div>
            </div>
            <span className="text-small text-muted info-locked">
              <FiLock size={13} /> Set by an admin
            </span>
          </div>

          {renderRow(
            ChangeRequestType.Email,
            "Email",
            staff.email,
            <div className="field">
              <label htmlFor="req-email">New email</label>
              <input
                id="req-email"
                type="email"
                value={valueForm}
                onChange={(e) => setValueForm(e.target.value)}
                maxLength={200}
                required
                autoFocus
              />
            </div>,
          )}

          {renderRow(
            ChangeRequestType.PhoneNumber,
            "Phone number",
            formatPhone(staff.phoneNumber),
            <div className="field">
              <label htmlFor="req-phone">New phone number</label>
              <PhoneInput
                id="req-phone"
                value={valueForm}
                onChange={setValueForm}
                required
                autoFocus
              />
            </div>,
          )}

          {decided.length > 0 && (
            <div className="decision-list">
              <div className="info-label">Recent decisions</div>
              {decided.map((r) => (
                <div className="decision" key={r.id}>
                  <span
                    className={`decision-icon ${r.status === "Approved" ? "ok" : "no"}`}
                  >
                    {r.status === "Approved" ? (
                      <FiCheck size={13} />
                    ) : (
                      <FiX size={13} />
                    )}
                  </span>
                  <div>
                    <div className="text-small">
                      Your {changeRequestLabel(r.type)} change was{" "}
                      {r.status === "Approved" ? "approved" : "declined"}
                      {r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ""}
                    </div>
                    {r.reviewNote && (
                      <div className="text-small text-muted">
                        “{r.reviewNote}”
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          id="security"
          icon={<FiShield size={18} />}
          title="Security"
          description="Change your password and manage the devices that skip the email code."
          open={openSections.includes("security")}
          onToggle={() => toggleSection("security")}
        >
          <div className="info-label">Change password</div>

          {pwError && <div className="form-error-banner">{pwError}</div>}
          {pwSuccess && (
            <div className="notice-banner">
              <FiCheck size={15} /> Password updated.
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pwLoading}
            >
              {pwLoading ? "Saving…" : "Update password"}
            </button>
          </form>

          <div className="settings-divider" />

          <div className="info-label">Trusted devices</div>
          <p className="text-muted text-small" style={{ marginBottom: 12 }}>
            Devices that skip the email code. Revoking one signs that device
            out, including this one.
          </p>

          {devicesLoading ? (
            <div className="device-list">
              <SkeletonLabel text="Loading trusted devices" />
              {[0, 1].map((i) => (
                <div className="device-card" key={i}>
                  <Skeleton
                    width={38}
                    height={38}
                    radius={10}
                    style={{ flexShrink: 0 }}
                  />
                  <div className="device-info">
                    <div className="skeleton-stack">
                      <Skeleton width="50%" height={14} />
                      <Skeleton width="75%" height={11} />
                    </div>
                  </div>
                  <Skeleton width={84} height={30} radius={8} />
                </div>
              ))}
            </div>
          ) : devices.length === 0 ? (
            <p className="text-muted text-small">No trusted devices.</p>
          ) : (
            <div className="device-list">
              {devices.map((d) => (
                <div
                  key={d.id}
                  className={`device-card ${d.isCurrent ? "current" : ""}`}
                >
                  <div className="device-icon">{deviceIcon(d.label)}</div>

                  <div className="device-info">
                    <div className="device-name">
                      {d.label || "Unknown device"}
                      {d.isCurrent && (
                        <span className="device-current-tag">This device</span>
                      )}
                    </div>
                    <div className="text-muted text-small">
                      Last used {formatDateTime(d.lastUsedAt)} · Trusted since{" "}
                      {formatDate(d.createdAt)}
                    </div>
                  </div>

                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleRevoke(d)}
                    title="Sign this device out"
                  >
                    <FiTrash2 size={14} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section
          id="preferences"
          icon={<FiBell size={18} />}
          title="Preferences"
          description="Choose which updates show up in your Updates list."
          open={openSections.includes("preferences")}
          onToggle={() => toggleSection("preferences")}
        >
          {prefsError && <div className="form-error-banner">{prefsError}</div>}

          {prefs === null && !prefsError ? (
            <div className="skeleton-stack">
              <SkeletonLabel text="Loading preferences" />
              <Skeleton width="100%" height={44} />
              <Skeleton width="100%" height={44} />
              <Skeleton width="100%" height={44} />
            </div>
          ) : (
            prefs && (
              <>
                {prefRows.map((row) => (
                  <div className="pref-row" key={row.key}>
                    <div>
                      <div className="info-value">{row.title}</div>
                      <div className="text-small text-muted">
                        {row.description}
                      </div>
                    </div>
                    <Switch
                      checked={prefs[row.key]}
                      onChange={(next) => void setPref(row.key, next)}
                      label={row.title}
                    />
                  </div>
                ))}
                <p className="text-small text-muted pref-foot">
                  {prefsSaved ? (
                    <span className="pref-saved">
                      <FiCheck size={13} /> Saved
                    </span>
                  ) : (
                    "Changes save as you make them. Replies to your change requests always show."
                  )}
                </p>
              </>
            )
          )}
        </Section>
      </div>
    </div>
  );
}
