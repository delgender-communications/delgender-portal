// external
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  FiTrash2,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiHelpCircle,
} from "react-icons/fi";

// internal
import { useAuth } from "../context/AuthContext";
import * as authService from "../services/authService";
import type { TrustedDevice } from "../services/authService";
import * as staffService from "../services/staffService";
import { initials, formatDate, formatDateTime } from "../utils/format";
import "./ListPage.css";
import "./DashboardPage.css";

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

export default function SettingsPage() {
  const { staff, refreshStaff } = useAuth();

  // profile picture
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // trusted devices
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);

  useEffect(() => {
    authService
      .getTrustedDevices()
      .then(setDevices)
      .finally(() => setDevicesLoading(false));
  }, []);

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

  const handleRevoke = async (id: number) => {
    await authService.revokeTrustedDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  if (!staff) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="text-muted">
            Your account, password, and trusted devices.
          </p>
        </div>
      </div>

      <div
        className="dashboard-grid"
        style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}
      >
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-title" style={{ marginBottom: 18 }}>
            Profile
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 6,
            }}
          >
            <div
              className="avatar"
              style={{ width: 64, height: 64, fontSize: 20 }}
            >
              {staff.profilePictureUrl ? (
                <img src={staff.profilePictureUrl} alt="" />
              ) : (
                initials(staff.name, staff.surname)
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {staff.name} {staff.surname}
              </div>
              <div className="text-muted text-small">
                {staff.jobTitle} · {staff.staffId}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Change picture"}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </div>
          </div>
          {uploadError && (
            <div className="form-error-banner" style={{ marginTop: 12 }}>
              {uploadError}
            </div>
          )}

          <div
            className="detail-grid"
            style={{ marginTop: 20, borderBottom: "none", paddingBottom: 0 }}
          >
            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{staff.email}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Phone</div>
              <div className="detail-value">{staff.phoneNumber}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Role</div>
              <div className="detail-value">{staff.role}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-title" style={{ marginBottom: 18 }}>
            Change password
          </div>

          {pwError && <div className="form-error-banner">{pwError}</div>}
          {pwSuccess && (
            <div
              className="form-error-banner"
              style={{
                background: "var(--success-dim)",
                borderColor: "var(--success-border)",
                color: "var(--success)",
              }}
            >
              Password updated.
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="field">
              <label>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input
                type="password"
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
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 6 }}>
          Trusted devices
        </div>
        <p className="text-muted text-small" style={{ marginBottom: 16 }}>
          Devices where you chose "don't ask for a code again" skip email
          verification on future sign-ins.
        </p>

        {devicesLoading ? (
          <div className="centered-loader" style={{ padding: "30px 0" }}>
            <div className="spinner" />
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
                  onClick={() => handleRevoke(d.id)}
                  title="Stop trusting this device"
                >
                  <FiTrash2 size={14} /> Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
