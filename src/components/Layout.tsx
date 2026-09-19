// external
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiBarChart2,
  FiCalendar,
  FiFileText,
  FiUsers,
  FiBriefcase,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

// internal
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/format";
import logo from "../assets/logo-mark.png";
import "./Layout.css";

type NavItem = {
  to: string;
  label: string;
  icon: typeof FiBarChart2;
  end?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Bookings", icon: FiCalendar },
  { to: "/invoices", label: "Invoices", icon: FiFileText },
  { to: "/clients", label: "Clients", icon: FiBriefcase },
  { to: "/analytics", label: "Analytics", icon: FiBarChart2, end: true },
  { to: "/staff", label: "Staff", icon: FiUsers },
];

export default function Layout() {
  const { staff, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!staff) {
    return null;
  }

  return (
    <div className="portal-shell">
      <button
        className="mobile-nav-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>

      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img
            src={logo}
            alt="Delgender Communications"
            className="brand-mark"
          />
          <div>
            <div className="brand-name">Delgender</div>
            <div className="brand-sub">Communications</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
            onClick={() => setMobileOpen(false)}
          >
            <FiSettings size={18} />
            Settings
          </NavLink>

          <button className="sidebar-link sidebar-signout" onClick={logout}>
            <FiLogOut size={18} />
            Sign out
          </button>

          <div className="sidebar-user">
            <div className="avatar">
              {staff.profilePictureUrl ? (
                <img src={staff.profilePictureUrl} alt="" />
              ) : (
                initials(staff.name, staff.surname)
              )}
            </div>
            <div>
              <div className="sidebar-user-name">
                {staff.name} {staff.surname}
              </div>
              <div className="sidebar-user-role">
                {isAdmin ? "Administrator" : staff.jobTitle}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
}
