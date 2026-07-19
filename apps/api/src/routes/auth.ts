import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { verifyPassword } from "../auth/password.ts";
import { createSession, invalidateSession, isValidSession } from "../sessionStore.ts";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60; // ~24 hours, matches sessionStore TTL

export const authRoute = new Hono()
  .post("/login", async (c) => {
    const body = await c.req.json<{ id?: unknown; password?: unknown }>();
    const id = typeof body.id === "string" ? body.id : "";
    const password = typeof body.password === "string" ? body.password : "";

    const expectedId = process.env.AUTH_USER_ID ?? "";
    const expectedPasswordHash = process.env.AUTH_PASSWORD_HASH ?? "";

    const idMatches = id === expectedId;
    const passwordMatches = verifyPassword(password, expectedPasswordHash);

    if (!idMatches || !passwordMatches) {
      return c.json({ error: "id or password is incorrect" }, 401);
    }

    const sessionId = createSession();
    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });

    return c.json({ ok: true }, 200);
  })
  .post("/logout", (c) => {
    const sessionId = getCookie(c, SESSION_COOKIE_NAME);
    if (sessionId) {
      invalidateSession(sessionId);
    }
    deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
    return c.json({ ok: true }, 200);
  })
  .get("/me", (c) => {
    const sessionId = getCookie(c, SESSION_COOKIE_NAME);
    const authenticated = sessionId !== undefined && isValidSession(sessionId);
    return c.json({ authenticated }, 200);
  });
