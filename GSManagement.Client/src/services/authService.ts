import { api, getDeviceId, setCsrfToken } from "../lib/api";
import type { CurrentUser, SessionResponse } from "../types/auth";

export { refreshSession } from "../lib/api";

export const login = async (email: string, password: string): Promise<void> => {
  const response = await api.post<SessionResponse>("/Auth/Login", {
    email,
    password,
    deviceId: getDeviceId(),
  });
  setCsrfToken(response.data.csrf_token);
};

export const logout = async (): Promise<void> => {
  try {
    await api.post("/Auth/Logout");
  } finally {
    setCsrfToken(null);
  }
};

// Always succeeds (unless the server is down): the backend never says
// whether the email exists.
export const requestPasswordReset = async (email: string): Promise<void> => {
  await api.post("/Auth/forgot-password", { email });
};

export const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<void> => {
  await api.post("/Auth/reset-password", { token, newPassword });
};

export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  const response = await api.get<CurrentUser>("/Auth/me");
  return response.data;
};
