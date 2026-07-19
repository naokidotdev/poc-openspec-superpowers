import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "./App.tsx";
import * as todoClient from "./api/todoClient.ts";

// Routing/auth-gating behavior only. Todo behavior itself is covered by
// pages/TodoPage.test.tsx.
vi.mock("./api/todoClient.ts", () => ({
  listTodos: vi.fn(),
  createTodo: vi.fn(),
  toggleTodo: vi.fn(),
  removeTodo: vi.fn(),
}));

const mockedTodoClient = vi.mocked(todoClient);

describe("App routing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedTodoClient.listTodos.mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects unauthenticated access to / to /login", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: false }),
    } as Response);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Todo" })).not.toBeInTheDocument();
  });

  it("renders the todo page for authenticated access to /", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: true }),
    } as Response);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Todo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Login" })).not.toBeInTheDocument();
  });
});
