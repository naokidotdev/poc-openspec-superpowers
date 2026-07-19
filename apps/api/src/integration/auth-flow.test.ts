import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { authRoute } from "../routes/auth.ts";
import { todosRoute } from "../routes/todos.ts";
import { hashPassword } from "../auth/password.ts";
import { resetSessions } from "../sessionStore.ts";
import { resetTodos } from "../store.ts";
import type { Todo } from "../types.ts";

// NOTE on app construction:
// `src/index.ts` calls `serve({ fetch: app.fetch, port })` at module scope and does not
// export the `app` instance (only `AppType`). Importing it directly in a test would bind
// a real OS port as a side effect of the import, which is unsafe/undesirable in a test
// suite. Instead, this test builds a Hono app by mounting the same real route modules
// (`authRoute`, `todosRoute`) under the same paths index.ts uses. This is not a
// reimplementation of any route logic -- it's the identical composition pattern already
// used by `routes/auth.test.ts` and `routes/todos.test.ts` (which each mount a single
// route), just combined here to exercise both together in the same app instance, the way
// the real server does.
const TEST_USER_ID = "integration-test-user";
const TEST_PASSWORD = "integration-test-password";

function buildApp() {
  return new Hono().route("/api/todos", todosRoute).route("/api/auth", authRoute);
}

function extractCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("expected a Set-Cookie header on the login response");
  return setCookie.split(";")[0] ?? "";
}

describe("integration: unauthenticated -> login -> todo CRUD -> logout -> revoked", () => {
  const originalUserId = process.env.AUTH_USER_ID;
  const originalPasswordHash = process.env.AUTH_PASSWORD_HASH;

  beforeEach(() => {
    resetSessions();
    resetTodos();
    process.env.AUTH_USER_ID = TEST_USER_ID;
    process.env.AUTH_PASSWORD_HASH = hashPassword(TEST_PASSWORD);
  });

  afterEach(() => {
    process.env.AUTH_USER_ID = originalUserId;
    process.env.AUTH_PASSWORD_HASH = originalPasswordHash;
  });

  it("exercises the full real flow through real routes and a real Set-Cookie round-trip", async () => {
    const app = buildApp();

    // 1. Unauthenticated request to GET /api/todos -> 401 (confirms the gate).
    const unauthedRes = await app.request("/api/todos");
    expect(unauthedRes.status).toBe(401);

    // 2. POST /api/auth/login with correct credentials -> 200, extract the real Set-Cookie.
    const loginRes = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: TEST_USER_ID, password: TEST_PASSWORD }),
    });
    expect(loginRes.status).toBe(200);
    const cookie = extractCookie(loginRes);
    expect(cookie).toMatch(/^session_id=/);

    // 3. Same session cookie authorizes create, list, toggle, delete.
    const createRes = await app.request("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ title: "Integration test todo" }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as Todo;
    expect(created.title).toBe("Integration test todo");
    expect(created.completed).toBe(false);

    const listRes = await app.request("/api/todos", { headers: { Cookie: cookie } });
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as Todo[];
    expect(list.map((t) => t.id)).toContain(created.id);

    const toggleRes = await app.request(`/api/todos/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ completed: true }),
    });
    expect(toggleRes.status).toBe(200);
    const toggled = (await toggleRes.json()) as Todo;
    expect(toggled.completed).toBe(true);

    const deleteRes = await app.request(`/api/todos/${created.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(204);

    // 4. POST /api/auth/logout with that cookie -> 200.
    const logoutRes = await app.request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(logoutRes.status).toBe(200);

    // 5. Using the now-invalidated cookie, GET /api/todos again -> 401 (server-side
    // revocation, not just a client-side cookie clear: we deliberately keep sending the
    // same cookie value that logout invalidated server-side).
    const postLogoutRes = await app.request("/api/todos", { headers: { Cookie: cookie } });
    expect(postLogoutRes.status).toBe(401);
  });
});
