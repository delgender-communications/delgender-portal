import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7123";

const ACCESS_TOKEN_KEY = "dgc_access_token";
const REFRESH_TOKEN_KEY = "dgc_refresh_token";
const REMEMBER_KEY = "dgc_remember_me";
const DEVICE_TOKEN_KEY = "dgc_device_token";

function getStore(): Storage {
  return localStorage.getItem(REMEMBER_KEY) === "1"
    ? localStorage
    : sessionStorage;
}

export const tokenStorage = {
  getAccessToken: () => getStore().getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => getStore().getItem(REFRESH_TOKEN_KEY),
  getDeviceToken: () => localStorage.getItem(DEVICE_TOKEN_KEY),

  setSession(accessToken: string, refreshToken: string, rememberMe: boolean) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);

    localStorage.setItem(REMEMBER_KEY, rememberMe ? "1" : "0");
    const store = rememberMe ? localStorage : sessionStorage;
    store.setItem(ACCESS_TOKEN_KEY, accessToken);
    store.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  setDeviceToken(token: string) {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  },

  clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  clearDeviceToken() {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
  },
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const rememberMe = localStorage.getItem(REMEMBER_KEY) === "1";
    const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
      refreshToken,
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    tokenStorage.setSession(accessToken, newRefreshToken, rememberMe);
    return accessToken;
  } catch {
    tokenStorage.clearSession();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }

      window.dispatchEvent(new CustomEvent("dgc:session-expired"));
    }

    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; detail?: string }
      | undefined;
    return data?.detail || data?.message || fallback;
  }
  return fallback;
}
