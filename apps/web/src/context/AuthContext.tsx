import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { checkAuthStatus } from "../api/authClient.ts";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  // Called by LoginPage/logout button after a successful login/logout to
  // update status directly, without another /api/auth/me round-trip.
  setAuthenticated: (authenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    // checkAuthStatus() itself fails closed (returns false on any
    // network/parse error), so no separate .catch() branch is needed here.
    checkAuthStatus().then((authenticated) => {
      if (!cancelled) {
        setStatus(authenticated ? "authenticated" : "unauthenticated");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Contract: `todoClient.ts` (and any future API client) dispatches this
    // event on `window` when a request comes back 401, signalling that the
    // session has expired.
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
