import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createSession, isValidSession, invalidateSession, resetSessions } from "./sessionStore.ts";

describe("sessionStore", () => {
  beforeEach(() => {
    resetSessions();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with no valid sessions after reset", () => {
    expect(isValidSession("nonexistent-id")).toBe(false);
  });

  it("issues a session id as a non-empty string", () => {
    const id = createSession();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("issues unique session ids across calls", () => {
    const id1 = createSession();
    const id2 = createSession();
    expect(id1).not.toBe(id2);
  });

  it("treats a freshly issued session as valid", () => {
    const id = createSession();
    expect(isValidSession(id)).toBe(true);
  });

  it("invalidates a session so it is no longer valid", () => {
    const id = createSession();
    invalidateSession(id);
    expect(isValidSession(id)).toBe(false);
  });

  it("does not throw when invalidating a nonexistent session", () => {
    expect(() => invalidateSession("nonexistent-id")).not.toThrow();
  });

  it("treats a session past its TTL as invalid", () => {
    vi.useFakeTimers();
    const id = createSession();
    expect(isValidSession(id)).toBe(true);

    // Advance past the ~24h TTL.
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);

    expect(isValidSession(id)).toBe(false);
  });

  it("treats a session just under its TTL as still valid", () => {
    vi.useFakeTimers();
    const id = createSession();

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 - 1000);

    expect(isValidSession(id)).toBe(true);
  });
});
