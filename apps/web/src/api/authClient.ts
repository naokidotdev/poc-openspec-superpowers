const GENERIC_LOGIN_ERROR = "ログインに失敗しました";

export type LoginResult = { ok: true } | { ok: false; error: string };

/**
 * Logs in with the given credentials. Never throws/rejects: both server-
 * reported failures (non-ok response) and network-level errors (fetch
 * rejecting) are reported via the `{ok: false, error}` branch so callers
 * don't need a try/catch.
 */
export async function login(id: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, password }),
    });

    if (!res.ok) {
      let message = GENERIC_LOGIN_ERROR;
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) {
          message = body.error;
        }
      } catch {
        // response had no JSON body; keep the generic message
      }
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch {
    // network error or similar; the request never got a response
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }
}

/**
 * Logs out. Best-effort: the server-side session invalidation is idempotent,
 * so even if this request fails (e.g. network error) callers should still
 * treat the user as logged out locally. This function therefore never
 * throws/rejects.
 */
export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // best-effort: swallow network errors, see doc comment above
  }
}

/**
 * Checks whether the current session is authenticated. Fails closed: any
 * network or parse error is treated as not authenticated.
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const body = (await res.json()) as { authenticated: boolean };
    return body.authenticated;
  } catch {
    return false;
  }
}
