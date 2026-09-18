// external
import { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";

// internal
import * as staffService from "../services/staffService";
import type { Staff } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import AddStaffModal from "../components/AddStaffModal";
import StaffAvatar from "../components/StaffAvatar";
import { formatDateTime } from "../utils/format";
import "./ListPage.css";

export default function StaffPage() {
  const { staff: currentStaff, isAdmin } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    staffService
      .getAllStaff(1, 100)
      .then((res) => setStaffList(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (member: Staff) => {
    setBusyId(member.id);
    setError(null);
    try {
      const updated = await staffService.updateStaff(member.id, {
        isActive: !member.isActive,
      });
      setStaffList((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't update that staff member.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (member: Staff, role: "Staff" | "Admin") => {
    setBusyId(member.id);
    setError(null);
    try {
      const updated = await staffService.updateStaff(member.id, { role });
      setStaffList((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't update that staff member's role.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const columnCount = isAdmin ? 7 : 3;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Staff</h1>
          <p className="text-muted">
            {isAdmin
              ? "Manage who has access to the staff portal."
              : "Everyone on the team."}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <FiPlus size={16} /> Add staff
          </button>
        )}
      </div>

      {error && <div className="form-error-banner">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Staff ID</th>
                <th>Job title</th>
                {isAdmin && (
                  <>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last login</th>
                    <th></th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="empty-row">
                    Loading…
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="empty-row">
                    No staff yet.
                  </td>
                </tr>
              ) : (
                staffList.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <StaffAvatar
                          name={member.name}
                          surname={member.surname}
                          profilePictureUrl={member.profilePictureUrl}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {member.name} {member.surname}
                          </div>
                          {isAdmin && (
                            <div className="text-muted text-small">
                              {member.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{member.staffId}</td>
                    <td>{member.jobTitle}</td>

                    {isAdmin && (
                      <>
                        <td>
                          <select
                            value={member.role}
                            disabled={
                              busyId === member.id ||
                              member.id === currentStaff?.id
                            }
                            onChange={(e) =>
                              changeRole(
                                member,
                                e.target.value as "Staff" | "Admin",
                              )
                            }
                            className={`badge badge-${member.role === "Admin" ? "admin" : "staff"}`}
                            style={{ border: "none", cursor: "pointer" }}
                          >
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <span
                            className={`badge ${member.isActive ? "badge-confirmed" : "badge-declined"}`}
                          >
                            {member.isActive ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="text-muted text-small">
                          {member.lastLoginAt
                            ? formatDateTime(member.lastLoginAt)
                            : "Never"}
                        </td>
                        <td>
                          {member.id !== currentStaff?.id && (
                            <button
                              className={`btn btn-sm ${member.isActive ? "btn-danger" : "btn-success"}`}
                              disabled={busyId === member.id}
                              onClick={() => toggleActive(member)}
                            >
                              {member.isActive ? "Deactivate" : "Reactivate"}
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && isAdmin && (
        <AddStaffModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}
