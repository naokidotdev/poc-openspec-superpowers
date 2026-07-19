import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { login } from "../api/authClient.ts";
import { useAuth } from "../context/AuthContext.tsx";

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
      const result = await login(id, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Update auth state before navigating so RequireAuth doesn't briefly
      // see a stale "unauthenticated" status and redirect back to /login.
      setAuthenticated(true);
      navigate("/");
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
