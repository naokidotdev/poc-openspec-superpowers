import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { todosRoute } from "./todos.ts";
import { resetTodos } from "../store.ts";
import type { Todo } from "../types.ts";

function buildApp() {
  const app = new Hono();
  app.route("/api/todos", todosRoute);
  return app;
}

describe("todos routes", () => {
  beforeEach(() => {
    resetTodos();
  });

  describe("GET /api/todos", () => {
    it("returns an empty list when no todos exist", async () => {
      const app = buildApp();
      const res = await app.request("/api/todos");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });

    it("returns all registered todos", async () => {
      const app = buildApp();
      await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "First" }),
      });
      await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Second" }),
      });

      const res = await app.request("/api/todos");
      expect(res.status).toBe(200);
      const body = (await res.json()) as Todo[];
      expect(body).toHaveLength(2);
      expect(body.map((t) => t.title)).toEqual(["First", "Second"]);
    });
  });

  describe("POST /api/todos", () => {
    it("creates a todo with a valid title, initialized as not completed", async () => {
      const app = buildApp();
      const res = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Buy milk" }),
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as Todo;
      expect(body.title).toBe("Buy milk");
      expect(body.completed).toBe(false);
      expect(typeof body.id).toBe("string");
      expect(typeof body.createdAt).toBe("string");

      const listRes = await app.request("/api/todos");
      const list = (await listRes.json()) as Todo[];
      expect(list).toHaveLength(1);
    });

    it("rejects creation with an empty title", async () => {
      const app = buildApp();
      const res = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      expect(res.status).toBe(400);

      const listRes = await app.request("/api/todos");
      const list = await listRes.json();
      expect(list).toEqual([]);
    });

    it("rejects creation with a whitespace-only title", async () => {
      const app = buildApp();
      const res = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "   " }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/todos/:id", () => {
    it("toggles an incomplete todo to completed", async () => {
      const app = buildApp();
      const createRes = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Buy milk" }),
      });
      const created = (await createRes.json()) as Todo;

      const res = await app.request(`/api/todos/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as Todo;
      expect(body.completed).toBe(true);
    });

    it("toggles a completed todo back to incomplete", async () => {
      const app = buildApp();
      const createRes = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Buy milk" }),
      });
      const created = (await createRes.json()) as Todo;

      await app.request(`/api/todos/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });

      const res = await app.request(`/api/todos/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as Todo;
      expect(body.completed).toBe(false);
    });

    it("returns 404 when toggling a nonexistent todo", async () => {
      const app = buildApp();
      const res = await app.request("/api/todos/nonexistent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/todos/:id", () => {
    it("deletes an existing todo", async () => {
      const app = buildApp();
      const createRes = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Buy milk" }),
      });
      const created = (await createRes.json()) as Todo;

      const res = await app.request(`/api/todos/${created.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(204);

      const listRes = await app.request("/api/todos");
      const list = await listRes.json();
      expect(list).toEqual([]);
    });

    it("returns 404 when deleting a nonexistent todo", async () => {
      const app = buildApp();
      const res = await app.request("/api/todos/nonexistent-id", {
        method: "DELETE",
      });
      expect(res.status).toBe(404);
    });
  });
});
