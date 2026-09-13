import { api, tokenStorage, extractErrorMessage } from "./api";

export const StaffRole = { Staff: "Staff", Admin: "Admin" } as const;
export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export interface Staff {
  id: number;
  staffId: string;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  role: StaffRole;
  isActive: boolean;
  mustChangePassword: boolean;
  profilePictureUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  deviceToken?: string | null;
  deviceTokenExpiresAt?: string | null;
}

export interface LoginResult {
  requiresOtp: boolean;
  pendingToken?: string | null;
  tokens?: AuthTokens | null;
  staff?: Staff | null;
}

export interface TrustedDevice {
  id: number;
  label?: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

function persistTokens(tokens: AuthTokens, rememberMe: boolean) {
  tokenStorage.setSession(tokens.accessToken, tokens.refreshToken, rememberMe);
  if (tokens.deviceToken) {
    tokenStorage.setDeviceToken(tokens.deviceToken);
  }
}

export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<LoginResult> {
  try {
    const deviceToken = tokenStorage.getDeviceToken() ?? undefined;
    const { data } = await api.post<LoginResult>("/api/v1/auth/login", {
      email,
      password,
      rememberMe,
      deviceToken,
    });

    if (!data.requiresOtp && data.tokens) {
      persistTokens(data.tokens, rememberMe);
    }

    return data;
  } catch (error) {
    throw new Error(
      extractErrorMessage(
        error,
        "Couldn't sign in. Check your details and try again.",
      ),
    );
  }
}

export async function verifyOtp(
  pendingToken: string,
  code: string,
  rememberMe: boolean,
  trustDevice: boolean,
): Promise<Staff> {
  try {
    const { data } = await api.post<{ tokens: AuthTokens; staff: Staff }>(
      "/api/v1/auth/verify-otp",
      {
        pendingToken,
        code,
        rememberMe,
        trustDevice,
      },
    );

    persistTokens(data.tokens, rememberMe);
    return data.staff;
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "That code didn't work. Please try again."),
    );
  }
}

export async function fetchMe(): Promise<Staff> {
  const { data } = await api.get<Staff>("/api/v1/staff/me");
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = tokenStorage.getRefreshToken();
  tokenStorage.clearSession();
  if (refreshToken) {
    try {
      await api.post("/api/v1/auth/logout", { refreshToken });
    } catch {
      // already cleared locally - nothing more to do
    }
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  try {
    await api.post("/api/v1/auth/change-password", {
      currentPassword,
      newPassword,
    });
  } catch (error) {
    throw new Error(
      extractErrorMessage(error, "Couldn't change your password."),
    );
  }
}

export async function getTrustedDevices(): Promise<TrustedDevice[]> {
  const { data } = await api.get<TrustedDevice[]>(
    "/api/v1/auth/trusted-devices",
  );
  return data;
}

export async function revokeTrustedDevice(id: number): Promise<void> {
  await api.delete(`/api/v1/auth/trusted-devices/${id}`);
}

export function forgetThisDevice() {
  tokenStorage.clearDeviceToken();
}
