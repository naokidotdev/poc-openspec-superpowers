import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listTodos, createTodo, toggleTodo, removeTodo } from "./todoClient.ts";
import type { Todo } from "./todoClient.ts";

const sampleTodo: Todo = {
  id: "1",
  title: "Buy milk",
  completed: false,
  createdAt: "2026-07-17T00:00:00.000Z",
};

function mockFetchOnce(body: unknown, init?: { status?: number; ok?: boolean }) {
  const status = init?.status ?? 200;
  const ok = init?.ok ?? (status >= 200 && status < 300);
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

// hc() (the Hono RPC client) issues requests via the global `fetch`, always
// passing a real `Headers` instance (not a plain object) as the second
// argument's `headers` field, and only sets `Content-Type` when a JSON body
// is present. These helpers build the exact expected `Headers` so
// `toHaveBeenCalledWith` deep-equality checks pass against the real
// `Headers` instance the client constructs.
const jsonHeaders = () => new Headers({ "Content-Type": "application/json" });
const noHeaders = () => new Headers();

describe("todoClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("listTodos", () => {
    it("GETs /api/todos and returns the parsed todo list", async () => {
      globalThis.fetch = mockFetchOnce([sampleTodo]);

      const result = await listTodos();

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos", {
        method: "GET",
        headers: noHeaders(),
      });
      expect(result).toEqual([sampleTodo]);
    });
  });

  describe("createTodo", () => {
    it("POSTs the title to /api/todos and returns the created todo", async () => {
      globalThis.fetch = mockFetchOnce(sampleTodo, { status: 201 });

      const result = await createTodo("Buy milk");

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ title: "Buy milk" }),
      });
      expect(result).toEqual(sampleTodo);
    });

    it("throws with the server's error message when the title is rejected (400)", async () => {
      globalThis.fetch = mockFetchOnce({ error: "title must not be empty" }, { status: 400, ok: false });

      await expect(createTodo("")).rejects.toThrow("title must not be empty");
    });
  });

  describe("toggleTodo", () => {
    it("PATCHes the completed state to /api/todos/:id and returns the updated todo", async () => {
      const updated = { ...sampleTodo, completed: true };
      globalThis.fetch = mockFetchOnce(updated);

      const result = await toggleTodo("1", true);

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos/1", {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify({ completed: true }),
      });
      expect(result).toEqual(updated);
    });

    it("throws with the server's error message when the todo does not exist (404)", async () => {
      globalThis.fetch = mockFetchOnce({ error: "todo not found" }, { status: 404, ok: false });

      await expect(toggleTodo("missing", true)).rejects.toThrow("todo not found");
    });
  });

  describe("removeTodo", () => {
    it("DELETEs /api/todos/:id", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

      await removeTodo("1");

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos/1", {
        method: "DELETE",
        headers: noHeaders(),
      });
    });

    it("throws with the server's error message when the todo does not exist (404)", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "todo not found" }),
      });

      await expect(removeTodo("missing")).rejects.toThrow("todo not found");
    });
  });

  describe("error handling fallback", () => {
    it("falls back to a generic message when the error response has no JSON body", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not JSON")),
      });

      await expect(listTodos()).rejects.toThrow("Request failed with status 500");
    });
  });

  describe("401 detection", () => {
    it("dispatches an 'auth:unauthorized' window event when a request comes back 401", async () => {
      const handler = vi.fn();
      window.addEventListener("auth:unauthorized", handler);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "unauthorized" }),
      });

      await expect(listTodos()).rejects.toThrow("unauthorized");

      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener("auth:unauthorized", handler);
    });

    it("does not dispatch 'auth:unauthorized' for other error statuses (e.g. 404)", async () => {
      const handler = vi.fn();
      window.addEventListener("auth:unauthorized", handler);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "todo not found" }),
      });

      await expect(toggleTodo("missing", true)).rejects.toThrow("todo not found");

      expect(handler).not.toHaveBeenCalled();
      window.removeEventListener("auth:unauthorized", handler);
    });
  });
});
