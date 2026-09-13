// external
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

// internal
import * as authService from "../services/authService";
import type { Staff } from "../services/authService";
import { tokenStorage } from "../services/api";

interface AuthContextValue {
  staff: Staff | null;
  isLoading: boolean;
  isAdmin: boolean;
  refreshStaff: () => Promise<void>;
  setStaff: (staff: Staff) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaffState] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadMe = useCallback(async () => {
    if (!tokenStorage.getAccessToken() && !tokenStorage.getRefreshToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authService.fetchMe();
      setStaffState(me);
    } catch {
      tokenStorage.clearSession();
      setStaffState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    const handler = () => {
      setStaffState(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("dgc:session-expired", handler);
    return () => window.removeEventListener("dgc:session-expired", handler);
  }, [navigate]);

  const logout = useCallback(async () => {
    await authService.logout();
    setStaffState(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        staff,
        isLoading,
        isAdmin: staff?.role === "Admin",
        refreshStaff: loadMe,
        setStaff: setStaffState,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
