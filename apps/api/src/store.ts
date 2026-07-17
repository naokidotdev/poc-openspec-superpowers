import type { Todo } from "./types.ts";

let todos: Todo[] = [];

export function listTodos(): Todo[] {
  return todos;
}

export function addTodo(title: string): Todo {
  const todo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  return todo;
}

export function toggleTodo(id: string, completed: boolean): Todo | undefined {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return undefined;
  todo.completed = completed;
  return todo;
}

export function deleteTodo(id: string): boolean {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}

export function resetTodos(): void {
  todos = [];
}
