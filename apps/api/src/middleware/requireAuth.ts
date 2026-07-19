import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { isValidSession } from "../sessionStore.ts";

const SESSION_COOKIE_NAME = "session_id";

export async function requireAuth(c: Context, next: Next) {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);

  if (sessionId === undefined || !isValidSession(sessionId)) {
    return c.json({ error: "authentication required" }, 401);
  }

  await next();
}
