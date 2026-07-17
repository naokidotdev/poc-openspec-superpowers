export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO8601
};

const BASE_URL = "/api/todos";

async function parseJsonOrThrow(res: Response): Promise<unknown> {
  if (!res.ok) {
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
  return res.json();
}

export async function listTodos(): Promise<Todo[]> {
  const res = await fetch(BASE_URL);
  return (await parseJsonOrThrow(res)) as Todo[];
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return (await parseJsonOrThrow(res)) as Todo;
}

export async function toggleTodo(id: string, completed: boolean): Promise<Todo> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  return (await parseJsonOrThrow(res)) as Todo;
}

export async function removeTodo(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // no JSON body (e.g. 204) or already-consumed; keep generic message
    }
    throw new Error(message);
  }
}
