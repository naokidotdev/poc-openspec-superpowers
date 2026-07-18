import { hc } from "hono/client";
import type { InferResponseType } from "hono/client";
import type { AppType } from "api";

// Base URL is the origin/root only. `AppType` bakes the `/api/todos` mount
// path into the client's property chain (`client.api.todos.$get()` etc.), so
// including "/api/todos" here would duplicate the path in every request. A
// relative "/" keeps requests same-origin, matching the previous hand-written
// `fetch("/api/todos")` calls (proxied through Vite's dev server).
const client = hc<AppType>("/");

// The `Todo` shape is derived from the server's actual GET /api/todos
// response type instead of being hand-written here, so server-side changes
// to the todo shape propagate to the client automatically.
export type Todo = InferResponseType<typeof client.api.todos.$get>[number];

/**
 * Throws an `Error` built from a non-ok RPC response: the response body's
 * `error` field when present, otherwise a generic status-based message.
 * Mirrors the previous hand-written fetch client's error behavior.
 *
 * `json()` is typed `Promise<unknown>` rather than the narrower error shape
 * Hono infers for POST/PATCH/DELETE's non-ok branch, so this one helper also
 * accepts GET's response type (which has no error variant to narrow to,
 * since the route never rejects). The `error` field is read via a runtime
 * check rather than a static cast onto a specific shape.
 */
async function throwRequestError(res: { status: number; json(): Promise<unknown> }): Promise<never> {
  let message = `Request failed with status ${res.status}`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) {
      message = body.error;
    }
  } catch {
    // response had no JSON body; keep the generic message
  }
  throw new Error(message);
}

export async function listTodos(): Promise<Todo[]> {
  const res = await client.api.todos.$get();
  if (!res.ok) {
    return throwRequestError(res);
  }
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  // The server's POST handler reads its body via `c.req.json<T>()` rather
  // than a Hono request validator, so Hono's RPC type inference can't derive
  // a JSON input schema for this route (`$post`'s inferred `args` type is
  // `{}`). Building the args as a plain variable (rather than passing a
  // fresh object literal inline) means TypeScript's excess-property check
  // doesn't reject the extra `json` field; at runtime the client reads
  // `args.json` directly, so the request body is still sent correctly.
  const args = { json: { title } };
  const res = await client.api.todos.$post(args);
  if (!res.ok) {
    return throwRequestError(res);
  }
  return res.json();
}

export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
  // Same underlying limitation as `createTodo`: the PATCH handler doesn't use
  // a validator, so `$patch`'s inferred `args` type only has `param`, not
  // `json`. See the comment there for why the variable indirection works.
  const args = { param: { id }, json: { completed } };
  const res = await client.api.todos[":id"].$patch(args);
  if (!res.ok) {
    return throwRequestError(res);
  }
  return res.json();
}

export async function removeTodo(id: string): Promise<void> {
  const res = await client.api.todos[":id"].$delete({ param: { id } });
  if (!res.ok) {
    return throwRequestError(res);
  }
}
