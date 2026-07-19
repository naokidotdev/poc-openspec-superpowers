import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { TodoPage } from "./TodoPage.tsx";
import * as todoClient from "../api/todoClient.ts";
import type { Todo } from "../api/todoClient.ts";
import { useAuth } from "../context/AuthContext.tsx";
import type { AuthContextValue } from "../context/AuthContext.tsx";

vi.mock("../api/todoClient.ts", () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  toggleTodo: vi.fn(),
  removeTodo: vi.fn(),
}));

vi.mock("../context/AuthContext.tsx", async () => {
  const actual = await vi.importActual<typeof import("../context/AuthContext.tsx")>("../context/AuthContext.tsx");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const mockedTodoClient = vi.mocked(todoClient);
const mockedUseAuth = vi.mocked(useAuth);

const existingTodo: Todo = {
  id: "1",
  title: "Buy milk",
  completed: false,
  createdAt: "2026-07-17T00:00:00.000Z",
};

function renderTodoPage() {
  const setAuthenticated = vi.fn();
  mockedUseAuth.mockReturnValue({ status: "authenticated", setAuthenticated } satisfies AuthContextValue);

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<TodoPage />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );

  return { setAuthenticated };
}

describe("TodoPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and displays todos on mount", async () => {
    mockedTodoClient.listTodos.mockResolvedValue([existingTodo]);

    renderTodoPage();

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
  });

  it("shows the empty state when there are no todos", async () => {
    mockedTodoClient.listTodos.mockResolvedValue([]);

    renderTodoPage();

    expect(await screen.findByText(/no todos/i)).toBeInTheDocument();
  });

  it("shows an error message when loading todos fails", async () => {
    mockedTodoClient.listTodos.mockRejectedValue(new Error("network error"));

    renderTodoPage();

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

    renderTodoPage();
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

    renderTodoPage();
    await screen.findByText("Buy milk");

    await user.click(screen.getByRole("checkbox"));

    expect(mockedTodoClient.toggleTodo).toHaveBeenCalledWith("1", true);
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
  });

  it("deletes a todo", async () => {
    const user = userEvent.setup();
    mockedTodoClient.listTodos.mockResolvedValue([existingTodo]);
    mockedTodoClient.removeTodo.mockResolvedValue(undefined);

    renderTodoPage();
    await screen.findByText("Buy milk");

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(mockedTodoClient.removeTodo).toHaveBeenCalledWith("1");
    await waitFor(() => expect(screen.queryByText("Buy milk")).not.toBeInTheDocument());
  });

  describe("logout", () => {
    it("calls the logout endpoint, clears auth state, and navigates to /login", async () => {
      const user = userEvent.setup();
      mockedTodoClient.listTodos.mockResolvedValue([]);
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      const { setAuthenticated } = renderTodoPage();
      await screen.findByText(/no todos/i);

      await user.click(screen.getByRole("button", { name: /log out/i }));

      expect(fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      expect(await screen.findByText("Login page")).toBeInTheDocument();
      expect(setAuthenticated).toHaveBeenCalledWith(false);
    });

    it("still logs the user out client-side and navigates when the logout request fails", async () => {
      const user = userEvent.setup();
      mockedTodoClient.listTodos.mockResolvedValue([]);
      vi.mocked(fetch).mockRejectedValue(new Error("network error"));

      const { setAuthenticated } = renderTodoPage();
      await screen.findByText(/no todos/i);

      await user.click(screen.getByRole("button", { name: /log out/i }));

      expect(await screen.findByText("Login page")).toBeInTheDocument();
      expect(setAuthenticated).toHaveBeenCalledWith(false);
    });
  });
});
