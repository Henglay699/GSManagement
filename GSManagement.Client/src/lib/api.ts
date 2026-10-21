import axios, { type InternalAxiosRequestConfig } from "axios";
import type { SessionResponse } from "../types/auth";

// Single HTTP client for the whole app. Every request goes through here,
// so auth headers and error handling only need to be added in one place.
// The access/refresh tokens live in HttpOnly cookies the browser sends by
// itself; this file only adds the device id and CSRF headers.
export const api = axios.create({ baseURL: "/api" });

// ---- Device id: identifies this browser's session on the backend ----

const DEVICE_ID_KEY = "deviceId";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    // crypto.randomUUID only exists on https/localhost, not on http://<LAN IP>.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ---- CSRF token: returned by Login/Refresh, kept in memory only ----

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

const SAFE_METHODS = ["get", "head", "options"];

api.interceptors.request.use((config) => {
  config.headers["X-Device-Id"] = getDeviceId();
  const method = (config.method ?? "get").toLowerCase();
  if (csrfToken && !SAFE_METHODS.includes(method)) {
    config.headers["XSRF-TOKEN"] = csrfToken;
  }
  return config;
});

// ---- Refresh on 401 ----

// Only one refresh may run at a time: the backend rotates the refresh token, so a
// second concurrent refresh would present the old one, which it treats as theft
// and revokes the whole session.
let refreshPromise: Promise<void> | null = null;

export function refreshSession(): Promise<void> {
  refreshPromise ??= api
    .post<SessionResponse>("/Auth/RefreshToken")
    .then((response) => setCsrfToken(response.data.csrf_token))
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

let onSessionExpired: (() => void) | null = null;

// Called when the session can't be refreshed, so the app can show the login page.
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

// These must not trigger a refresh-and-retry themselves.
const NO_RETRY_URLS = ["/Auth/Login", "/Auth/RefreshToken", "/Auth/Logout"];

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config as
    | (InternalAxiosRequestConfig & { _retried?: boolean })
    | undefined;

  if (
    !axios.isAxiosError(error) ||
    error.response?.status !== 401 ||
    !config ||
    config._retried ||
    NO_RETRY_URLS.includes(config.url ?? "")
  ) {
    throw error;
  }

  config._retried = true;
  try {
    await refreshSession();
  } catch {
    onSessionExpired?.();
    throw error;
  }
  // The request interceptor runs again and attaches the new CSRF token.
  return api(config);
});

// The backend returns errors as either { error } or { message }.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Backend server can't be reached.";
    const body = error.response.data as
      | { error?: string; message?: string }
      | undefined;
    return body?.error || body?.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
