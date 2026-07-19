import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { login, logout, checkAuthStatus } from "./authClient.ts";

describe("authClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("login", () => {
    it("posts credentials to /api/auth/login and returns ok: true on success", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      const result = await login("alice", "secret");

      expect(fetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: "alice", password: "secret" }),
      });
      expect(result).toEqual({ ok: true });
    });

    it("returns ok: false with the server's error message when login fails", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "id or password is incorrect" }),
      } as Response);

      const result = await login("alice", "wrong");

      expect(result).toEqual({ ok: false, error: "id or password is incorrect" });
    });

    it("returns ok: false with a generic Japanese fallback when the failure response has no error body", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("no body")),
      } as Response);

      const result = await login("alice", "secret");

      expect(result).toEqual({ ok: false, error: "ログインに失敗しました" });
    });

    it("returns ok: false with a generic Japanese fallback when the fetch itself rejects", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("network error"));

      const result = await login("alice", "secret");

      expect(result).toEqual({ ok: false, error: "ログインに失敗しました" });
    });
  });

  describe("logout", () => {
    it("posts to /api/auth/logout with credentials included", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      await logout();

      expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    });

    it("resolves without throwing even when the fetch rejects", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("network error"));

      await expect(logout()).resolves.toBeUndefined();
    });
  });

  describe("checkAuthStatus", () => {
    it("GETs /api/auth/me and returns the authenticated boolean", async () => {
      vi.mocked(fetch).mockResolvedValue({
        json: () => Promise.resolve({ authenticated: true }),
      } as Response);

      const result = await checkAuthStatus();

      expect(fetch).toHaveBeenCalledWith("/api/auth/me", { credentials: "include" });
      expect(result).toBe(true);
    });

    it("returns false when /api/auth/me reports authenticated: false", async () => {
      vi.mocked(fetch).mockResolvedValue({
        json: () => Promise.resolve({ authenticated: false }),
      } as Response);

      const result = await checkAuthStatus();

      expect(result).toBe(false);
    });

    it("fails closed to false when the fetch rejects", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("network error"));

      const result = await checkAuthStatus();

      expect(result).toBe(false);
    });

    it("fails closed to false when the response body cannot be parsed", async () => {
      vi.mocked(fetch).mockResolvedValue({
        json: () => Promise.reject(new Error("invalid json")),
      } as Response);

      const result = await checkAuthStatus();

      expect(result).toBe(false);
    });
  });
});
