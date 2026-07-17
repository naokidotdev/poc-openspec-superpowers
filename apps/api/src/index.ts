import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { todosRoute } from "./routes/todos.ts";

const app = new Hono();

app.route("/api/todos", todosRoute);

const port = 3001;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API server listening on http://localhost:${info.port}`);
});
