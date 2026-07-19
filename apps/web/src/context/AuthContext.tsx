import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  // Called by LoginPage/logout button (later tasks) after a successful login/logout
  // to update status directly, without another /api/auth/me round-trip.
  setAuthenticated: (authenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    // Note: this inline fetch will be replaced by a dedicated API client in a later task.
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((body: { authenticated: boolean }) => {
        if (!cancelled) {
          setStatus(body.authenticated ? "authenticated" : "unauthenticated");
        }
      })
      .catch(() => {
        // Fail closed: any network/parse error is treated as unauthenticated.
        if (!cancelled) {
          setStatus("unauthenticated");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Contract: a later task (frontend API client) dispatches this event on `window`
    // when a request comes back 401, signalling that the session has expired.
    function handleUnauthorized() {
      setStatus("unauthenticated");
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  function setAuthenticated(authenticated: boolean) {
    setStatus(authenticated ? "authenticated" : "unauthenticated");
  }

  return <AuthContext.Provider value={{ status, setAuthenticated }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
