import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import OtpPage from "./pages/OtpPage";
import DashboardPage from "./pages/DashboardPage";
import BookingsPage from "./pages/BookingsPage";
import ClientsPage from "./pages/ClientsPage";
import InvoicesPage from "./pages/InvoicesPage";
import StaffPage from "./pages/StaffPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/analytics" element={<DashboardPage />} />
          <Route path="/" element={<BookingsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/staff" element={<StaffPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
