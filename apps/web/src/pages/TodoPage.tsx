import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "../api/authClient.ts";
import { createTodo, listTodos, removeTodo, toggleTodo, type Todo } from "../api/todoClient.ts";
import { TodoForm } from "../components/TodoForm.tsx";
import { TodoList } from "../components/TodoList.tsx";
import { useAuth } from "../context/AuthContext.tsx";

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { setAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  async function handleLogout() {
    // logout() is best-effort and never throws (see its doc comment), so the
    // client-side logout below always runs regardless of network outcome.
    await logout();
    setAuthenticated(false);
    navigate("/login");
  }

  return (
    <main>
      <h1>Todo</h1>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
      <TodoForm onSubmit={handleCreate} />
      {error ? <p>{error}</p> : <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />}
    </main>
  );
}
