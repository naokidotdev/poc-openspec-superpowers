import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authRoute } from "./routes/auth.ts";
import { todosRoute } from "./routes/todos.ts";

const app = new Hono().route("/api/todos", todosRoute).route("/api/auth", authRoute);

export type AppType = typeof app;

const port = 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server listening on http://localhost:${info.port}`);
});
