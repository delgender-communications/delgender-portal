// external
import { useRef, useState, type FormEvent, type ClipboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// internal
import * as authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

interface LocationState {
  pendingToken: string;
  rememberMe: boolean;
}

export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setStaff } = useAuth();
  const state = location.state as LocationState | null;

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [trustDevice, setTrustDevice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  if (!state?.pendingToken) {
    navigate("/login", { replace: true });
    return null;
  }

  const setDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, i) => pasted[i] ?? ""));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const staff = await authService.verifyOtp(
        state.pendingToken,
        code,
        state.rememberMe,
        trustDevice,
      );
      setStaff(staff);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-subtitle">
          Enter the 6-digit code we just sent you. It expires in 10 minutes.
        </p>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-input">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoFocus={i === 0}
                onChange={(e) => setDigit(i, e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digit && i > 0)
                    inputs.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>

          <label className="checkbox-row" style={{ margin: "20px 0 22px" }}>
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
            />
            Don't ask for a code on this device again
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Verifying…" : "Verify & sign in"}
          </button>
        </form>

        <p className="auth-footer-link">
          <button type="button" onClick={() => navigate("/login")}>
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}
