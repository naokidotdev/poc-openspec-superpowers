import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App.tsx";
import * as todoClient from "./api/todoClient.ts";
import type { Todo } from "./api/todoClient.ts";

vi.mock("./api/todoClient.ts", () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  toggleTodo: vi.fn(),
  removeTodo: vi.fn(),
}));

const mockedTodoClient = vi.mocked(todoClient);

const existingTodo: Todo = {
  id: "1",
  title: "Buy milk",
  completed: false,
  createdAt: "2026-07-17T00:00:00.000Z",
};

describe("App", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads and displays todos on mount", async () => {
    mockedTodoClient.listTodos.mockResolvedValue([existingTodo]);

    render(<App />);

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
  });

  it("shows the empty state when there are no todos", async () => {
    mockedTodoClient.listTodos.mockResolvedValue([]);

    render(<App />);

    expect(await screen.findByText(/no todos/i)).toBeInTheDocument();
  });

  it("shows an error message when loading todos fails", async () => {
    mockedTodoClient.listTodos.mockRejectedValue(new Error("network error"));

    render(<App />);

    expect(await screen.findByText(/failed to load todos/i)).toBeInTheDocument();
    expect(screen.queryByText(/no todos/i)).not.toBeInTheDocument();
  });

  it("creates a todo and adds it to the list", async () => {
    const user = userEvent.setup();
    mockedTodoClient.listTodos.mockResolvedValue([]);
    const created: Todo = {
      id: "2",
      title: "New task",
      completed: false,
      createdAt: "2026-07-17T00:00:00.000Z",
    };
    mockedTodoClient.createTodo.mockResolvedValue(created);

    render(<App />);
    await screen.findByText(/no todos/i);

    await user.type(screen.getByRole("textbox", { name: /title/i }), "New task");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(mockedTodoClient.createTodo).toHaveBeenCalledWith("New task");
    expect(await screen.findByText("New task")).toBeInTheDocument();
  });

  it("toggles a todo's completed state", async () => {
    const user = userEvent.setup();
    mockedTodoClient.listTodos.mockResolvedValue([existingTodo]);
    mockedTodoClient.toggleTodo.mockResolvedValue({ ...existingTodo, completed: true });

    render(<App />);
    await screen.findByText("Buy milk");

    await user.click(screen.getByRole("checkbox"));

    expect(mockedTodoClient.toggleTodo).toHaveBeenCalledWith("1", true);
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
  });

  it("deletes a todo", async () => {
    const user = userEvent.setup();
    mockedTodoClient.listTodos.mockResolvedValue([existingTodo]);
    mockedTodoClient.removeTodo.mockResolvedValue(undefined);

    render(<App />);
    await screen.findByText("Buy milk");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(mockedTodoClient.removeTodo).toHaveBeenCalledWith("1");
    await waitFor(() => expect(screen.queryByText("Buy milk")).not.toBeInTheDocument());
  });
});
