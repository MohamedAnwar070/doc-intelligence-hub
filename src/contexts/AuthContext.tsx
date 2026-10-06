import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";
const SESSION_EXPIRED_KEY = "session_expired";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role?: "admin" | "user") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function clearStoredAuth() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

function markSessionExpired() {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
}

function decodeTokenExpiry(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(window.atob(padded)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function loadFromStorage(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem("auth_token");
    const raw = localStorage.getItem("auth_user");
    const user = raw ? (JSON.parse(raw) as AuthUser) : null;
    const expiresAt = token ? decodeTokenExpiry(token) : null;

    if (!token || !user) {
      clearStoredAuth();
      return { token: null, user: null };
    }

    if (!expiresAt || expiresAt <= Date.now()) {
      clearStoredAuth();
      markSessionExpired();
      return { token: null, user: null };
    }

    return { token, user };
  } catch {
    clearStoredAuth();
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadFromStorage();
  const [token, setToken] = useState<string | null>(stored.token);
  const [user, setUser] = useState<AuthUser | null>(stored.user);
  const logoutTimerRef = useRef<number | null>(null);

  const logout = useCallback((expired = false) => {
    clearStoredAuth();
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (expired) {
      markSessionExpired();
    }
    setToken(null);
    setUser(null);
    if (expired && window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }, []);

  const scheduleAutoLogout = useCallback((nextToken: string | null) => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    if (!nextToken) {
      return;
    }

    const expiresAt = decodeTokenExpiry(nextToken);
    if (!expiresAt || expiresAt <= Date.now()) {
      logout(true);
      return;
    }

    logoutTimerRef.current = window.setTimeout(() => {
      logout(true);
    }, expiresAt - Date.now());
  }, [logout]);

  useEffect(() => {
    scheduleAutoLogout(token);
    return () => {
      if (logoutTimerRef.current) {
        window.clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [scheduleAutoLogout, token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("auth_token", data.access_token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    setToken(data.access_token);
    setUser(data.user as AuthUser);
  }, []);

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
    role: "admin" | "user" = "user"
  ) => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
