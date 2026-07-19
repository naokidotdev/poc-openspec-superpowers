import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.tsx";

// Inline fetch call here (rather than a dedicated API client) is intentional
// for this task; a later task extracts this and similar calls into
// apps/web/src/api/authClient.ts.
const GENERIC_LOGIN_ERROR = "ログインに失敗しました";

export function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

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
        setError(message);
        return;
      }

      // Update auth state before navigating so RequireAuth doesn't briefly
      // see a stale "unauthenticated" status and redirect back to /login.
      setAuthenticated(true);
      navigate("/");
    } catch {
      // network error or similar; the request never got a response
      setError(GENERIC_LOGIN_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-id">ID</label>
        <input id="login-id" type="text" value={id} onChange={(event) => setId(event.target.value)} />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button type="submit" disabled={isSubmitting}>
          Log in
        </button>

        {error ? <p role="alert">{error}</p> : null}
      </form>
    </main>
  );
}
