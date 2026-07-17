import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodoList } from "./TodoList.tsx";
import type { Todo } from "../api/todoClient.ts";

const todos: Todo[] = [
  { id: "1", title: "Buy milk", completed: false, createdAt: "2026-07-17T00:00:00.000Z" },
  { id: "2", title: "Walk the dog", completed: true, createdAt: "2026-07-17T00:00:00.000Z" },
];

describe("TodoList", () => {
  it("shows an empty-state message when there are no todos", () => {
    render(<TodoList todos={[]} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/no todos/i)).toBeInTheDocument();
  });

  it("does not show the empty-state message when todos exist", () => {
    render(<TodoList todos={todos} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/no todos/i)).not.toBeInTheDocument();
  });

  it("renders one item per todo", () => {
    render(<TodoList todos={todos} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
