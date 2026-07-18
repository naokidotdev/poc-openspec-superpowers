import { Hono } from "hono";
import { addTodo, deleteTodo, listTodos, toggleTodo } from "../store.ts";

export const todosRoute = new Hono()
  .get("/", (c) => {
    return c.json(listTodos());
  })
  .post("/", async (c) => {
    const body = await c.req.json<{ title?: unknown }>();
    const title = typeof body.title === "string" ? body.title : "";

    if (title.trim() === "") {
      return c.json({ error: "title must not be empty" }, 400);
    }

    const todo = addTodo(title.trim());
    return c.json(todo, 201);
  })
  .patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{ completed?: unknown }>();
    const completed = body.completed === true;

    const updated = toggleTodo(id, completed);
    if (!updated) {
      return c.json({ error: "todo not found" }, 404);
    }

    return c.json(updated, 200);
  })
  .delete("/:id", (c) => {
    const id = c.req.param("id");
    const deleted = deleteTodo(id);
    if (!deleted) {
      return c.json({ error: "todo not found" }, 404);
    }

    return c.body(null, 204);
  });
