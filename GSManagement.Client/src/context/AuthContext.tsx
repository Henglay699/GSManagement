import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as signalR from "@microsoft/signalr";
import { setSessionExpiredHandler } from "../lib/api";
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "../services/authService";
import type { CurrentUser } from "../types/auth";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextType {
  user: CurrentUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Reloads the profile/permissions, e.g. after editing your own profile.
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  // The live UserHub connection once it has started (null before/after),
  // so other features can listen on it without opening their own.
  hub: signalR.HubConnection | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [hub, setHub] = useState<signalR.HubConnection | null>(null);

  // On page load the CSRF token (kept in memory) is gone, so restore the
  // session by refreshing first: that also issues a new CSRF token.
  useEffect(() => {
    let cancelled = false;
    refreshSession()
      .then(fetchCurrentUser)
      .then(
        (currentUser) => {
          if (cancelled) return;
          setUser(currentUser);
          setStatus("authenticated");
        },
        () => {
          if (!cancelled) setStatus("anonymous");
        },
      );
    return () => {
      cancelled = true;
    };
  }, []);

  // The backend sends "AccessChanged" to a user when their roles or a role's
  // permissions change, so menus and buttons update without a page reload.
  const isAuthenticated = status === "authenticated";
  useEffect(() => {
    if (!isAuthenticated) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/api/userhub")
      .withAutomaticReconnect()
      .build();

    connection.on("AccessChanged", () => {
      // A deactivated/deleted user gets 401 here; the api client then
      // fails to refresh and the session-expired handler logs them out.
      fetchCurrentUser().then(setUser, () => {});
    });

    connection
      .start()
      .then(() => setHub(connection))
      .catch((err) => console.error("SignalR error:", err));
    return () => {
      setHub(null);
      connection.stop();
    };
  }, [isAuthenticated]);

  // A request failed with 401 and the session couldn't be refreshed.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
    setUser(await fetchCurrentUser());
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(await fetchCurrentUser());
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      status,
      login,
      logout,
      refreshUser,
      hasPermission: (permission) =>
        user?.permissions.includes(permission) ?? false,
      hub,
    }),
    [user, status, login, logout, refreshUser, hub],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
