import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { authRoute } from "./auth.ts";
import { hashPassword } from "../auth/password.ts";
import { resetSessions } from "../sessionStore.ts";

const TEST_USER_ID = "testuser";
const TEST_PASSWORD = "correct-horse-battery-staple";

function buildApp() {
  const app = new Hono();
  app.route("/api/auth", authRoute);
  return app;
}

function extractCookie(res: Response): string | undefined {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return undefined;
  return setCookie.split(";")[0];
}

describe("auth routes", () => {
  const originalUserId = process.env.AUTH_USER_ID;
  const originalPasswordHash = process.env.AUTH_PASSWORD_HASH;

  beforeEach(() => {
    resetSessions();
    process.env.AUTH_USER_ID = TEST_USER_ID;
    process.env.AUTH_PASSWORD_HASH = hashPassword(TEST_PASSWORD);
  });

  afterEach(() => {
    process.env.AUTH_USER_ID = originalUserId;
    process.env.AUTH_PASSWORD_HASH = originalPasswordHash;
  });

  describe("POST /api/auth/login", () => {
    it("logs in with the correct id and password and sets an httpOnly session cookie", async () => {
      const app = buildApp();
      const res = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: TEST_USER_ID, password: TEST_PASSWORD }),
      });

      expect(res.status).toBe(200);

      const setCookie = res.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toMatch(/session_id=/);
      expect(setCookie).toMatch(/HttpOnly/i);
      expect(setCookie).toMatch(/SameSite=Lax/i);
      expect(setCookie).toMatch(/Path=\//);
      expect(setCookie).toMatch(/Max-Age=/i);
    });

    it("rejects an incorrect password with a generic 401 and no cookie", async () => {
      const app = buildApp();
      const res = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: TEST_USER_ID, password: "wrong-password" }),
      });

      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toBeFalsy();
      const body = await res.json();
      expect(body).toHaveProperty("error");
    });

    it("rejects an incorrect id with a generic 401 and no cookie", async () => {
      const app = buildApp();
      const res = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "not-the-user", password: TEST_PASSWORD }),
      });

      expect(res.status).toBe(401);
      expect(res.headers.get("set-cookie")).toBeFalsy();
    });

    it("returns the same generic error message for wrong id and wrong password (no user enumeration)", async () => {
      const app = buildApp();
      const wrongIdRes = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "not-the-user", password: TEST_PASSWORD }),
      });
      const wrongPasswordRes = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: TEST_USER_ID, password: "wrong-password" }),
      });

      const wrongIdBody = await wrongIdRes.json();
      const wrongPasswordBody = await wrongPasswordRes.json();
      expect(wrongIdBody).toEqual(wrongPasswordBody);
    });
  });

  describe("GET /api/auth/me", () => {
    it("reports authenticated: false when there is no session cookie", async () => {
      const app = buildApp();
      const res = await app.request("/api/auth/me");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ authenticated: false });
    });

    it("reports authenticated: true when a valid session cookie is present", async () => {
      const app = buildApp();
      const loginRes = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: TEST_USER_ID, password: TEST_PASSWORD }),
      });
      const cookie = extractCookie(loginRes);

      const res = await app.request("/api/auth/me", {
        headers: { Cookie: cookie ?? "" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ authenticated: true });
    });

    it("reports authenticated: false for an invalid/unknown session cookie", async () => {
      const app = buildApp();
      const res = await app.request("/api/auth/me", {
        headers: { Cookie: "session_id=not-a-real-session" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ authenticated: false });
    });
  });

  describe("POST /api/auth/logout", () => {
    it("invalidates the session and clears the cookie", async () => {
      const app = buildApp();
      const loginRes = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: TEST_USER_ID, password: TEST_PASSWORD }),
      });
      const cookie = extractCookie(loginRes);

      const logoutRes = await app.request("/api/auth/logout", {
        method: "POST",
        headers: { Cookie: cookie ?? "" },
      });
      expect(logoutRes.status).toBe(200);

      const meRes = await app.request("/api/auth/me", {
        headers: { Cookie: cookie ?? "" },
      });
      const meBody = await meRes.json();
      expect(meBody).toEqual({ authenticated: false });
    });

    it("is idempotent when there is no session cookie", async () => {
      const app = buildApp();
      const res = await app.request("/api/auth/logout", { method: "POST" });
      expect(res.status).toBe(200);
    });

    it("is idempotent when the session cookie is already invalid", async () => {
      const app = buildApp();
      const res = await app.request("/api/auth/logout", {
        method: "POST",
        headers: { Cookie: "session_id=not-a-real-session" },
      });
      expect(res.status).toBe(200);
    });
  });
});
