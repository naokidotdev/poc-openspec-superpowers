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

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos");
      expect(result).toEqual([sampleTodo]);
    });
  });

  describe("createTodo", () => {
    it("POSTs the title to /api/todos and returns the created todo", async () => {
      globalThis.fetch = mockFetchOnce(sampleTodo, { status: 201 });

      const result = await createTodo("Buy milk");

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Buy milk" }),
      });
      expect(result).toEqual(sampleTodo);
    });

    it("throws when the server rejects the title (400)", async () => {
      globalThis.fetch = mockFetchOnce({ error: "title must not be empty" }, { status: 400, ok: false });

      await expect(createTodo("")).rejects.toThrow();
    });
  });

  describe("toggleTodo", () => {
    it("PATCHes the completed state to /api/todos/:id and returns the updated todo", async () => {
      const updated = { ...sampleTodo, completed: true };
      globalThis.fetch = mockFetchOnce(updated);

      const result = await toggleTodo("1", true);

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      expect(result).toEqual(updated);
    });

    it("throws when the todo does not exist (404)", async () => {
      globalThis.fetch = mockFetchOnce({ error: "todo not found" }, { status: 404, ok: false });

      await expect(toggleTodo("missing", true)).rejects.toThrow();
    });
  });

  describe("removeTodo", () => {
    it("DELETEs /api/todos/:id", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });

      await removeTodo("1");

      expect(globalThis.fetch).toHaveBeenCalledWith("/api/todos/1", { method: "DELETE" });
    });

    it("throws when the todo does not exist (404)", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "todo not found" }),
      });

      await expect(removeTodo("missing")).rejects.toThrow();
    });
  });
});
