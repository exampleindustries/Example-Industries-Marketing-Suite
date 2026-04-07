import { useState, useEffect, useCallback } from "react";

// Raw fetch for auth — does not throw on non-200 like apiRequest
const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";
function authFetch(url: string, options?: RequestInit) {
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
  });
}

interface AuthUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

let globalAuthState: AuthState = { user: null, loading: true, error: null };
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach(fn => fn());
}

export function useAuth() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      globalAuthState = { ...globalAuthState, loading: true, error: null };
      notify();
      const res = await authFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        globalAuthState = { user: data.user, loading: false, error: null };
      } else {
        globalAuthState = { user: null, loading: false, error: null };
      }
    } catch {
      globalAuthState = { user: null, loading: false, error: null };
    }
    notify();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    globalAuthState = { ...globalAuthState, loading: true, error: null };
    notify();
    try {
      const res = await authFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      if (res.ok) {
        const data = await res.json();
        globalAuthState = { user: data.user, loading: false, error: null };
        notify();
        return true;
      } else {
        const data = await res.json();
        globalAuthState = { user: null, loading: false, error: data.error || "Login failed" };
        notify();
        return false;
      }
    } catch {
      globalAuthState = { user: null, loading: false, error: "Network error" };
      notify();
      return false;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, displayName: string) => {
    globalAuthState = { ...globalAuthState, loading: true, error: null };
    notify();
    try {
      const res = await authFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ username, email, password, displayName }) });
      if (res.ok) {
        const data = await res.json();
        globalAuthState = { user: data.user, loading: false, error: null };
        notify();
        return true;
      } else {
        const data = await res.json();
        globalAuthState = { ...globalAuthState, loading: false, error: data.error || "Registration failed" };
        notify();
        return false;
      }
    } catch {
      globalAuthState = { ...globalAuthState, loading: false, error: "Network error" };
      notify();
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await authFetch("/api/auth/logout", { method: "POST" });
    globalAuthState = { user: null, loading: false, error: null };
    notify();
  }, []);

  const clearError = useCallback(() => {
    globalAuthState = { ...globalAuthState, error: null };
    notify();
  }, []);

  // Initial auth check
  useEffect(() => {
    if (globalAuthState.loading && !globalAuthState.user) {
      checkAuth();
    }
  }, [checkAuth]);

  return {
    user: globalAuthState.user,
    loading: globalAuthState.loading,
    error: globalAuthState.error,
    login,
    register,
    logout,
    clearError,
  };
}
