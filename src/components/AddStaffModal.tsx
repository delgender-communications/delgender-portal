// external
import { useState } from "react";
import { FiX } from "react-icons/fi";

// internal
import * as staffService from "../services/staffService";
import { StaffRole } from "../services/authService";
import type { Staff } from "../services/authService";

export default function AddStaffModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (s: Staff) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    phoneNumber: "",
    jobTitle: "",
    role: StaffRole.Staff as StaffRole,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.surname ||
      !form.email ||
      !form.phoneNumber ||
      !form.jobTitle
    ) {
      setError("Fill in every field.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const staff = await staffService.createStaff(form);
      onAdded(staff);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't add that staff member.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: 19 }}>Add staff member</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <p className="text-muted text-small" style={{ marginBottom: 18 }}>
          They'll get a welcome email with a temporary password and a link to
          sign in. They can't register themselves.
        </p>

        <div className="field">
          <label>First name</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Surname</label>
          <input
            value={form.surname}
            onChange={(e) => set("surname", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input
            value={form.phoneNumber}
            onChange={(e) => set("phoneNumber", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Job title</label>
          <input
            value={form.jobTitle}
            onChange={(e) => set("jobTitle", e.target.value)}
          />
        </div>
        <div className="field">
          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
          >
            <option value={StaffRole.Staff}>Staff</option>
            <option value={StaffRole.Admin}>Admin</option>
          </select>
          <span className="field-hint">
            Admins can add/deactivate staff and manage everyone's bookings and
            invoices.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding…" : "Add staff member"}
          </button>
        </div>
      </div>
    </div>
  );
}
