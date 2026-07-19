import { useEffect, useState } from "react";
import { createTodo, listTodos, removeTodo, toggleTodo, type Todo } from "../api/todoClient.ts";
import { TodoForm } from "../components/TodoForm.tsx";
import { TodoList } from "../components/TodoList.tsx";

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTodos()
      .then(setTodos)
      .catch(() => setError("Failed to load todos."));
  }, []);

  async function handleCreate(title: string) {
    const created = await createTodo(title);
    setTodos((current) => [...current, created]);
  }

  async function handleToggle(id: string) {
    const target = todos.find((todo) => todo.id === id);
    if (!target) {
      return;
    }
    const updated = await toggleTodo(id, !target.completed);
    setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)));
  }

  async function handleDelete(id: string) {
    await removeTodo(id);
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  return (
    <main>
      <h1>Todo</h1>
      <TodoForm onSubmit={handleCreate} />
      {error ? <p>{error}</p> : <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />}
    </main>
  );
}
