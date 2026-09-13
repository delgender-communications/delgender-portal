// external
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

// internal
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { staff, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="centered-loader" style={{ minHeight: "100svh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!staff) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
