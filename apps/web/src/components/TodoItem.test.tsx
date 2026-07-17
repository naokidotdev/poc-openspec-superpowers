import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoItem } from "./TodoItem.tsx";
import type { Todo } from "../api/todoClient.ts";

const incompleteTodo: Todo = {
  id: "1",
  title: "Buy milk",
  completed: false,
  createdAt: "2026-07-17T00:00:00.000Z",
};

const completeTodo: Todo = { ...incompleteTodo, id: "2", completed: true };

describe("TodoItem", () => {
  it("renders the todo title", () => {
    render(<TodoItem todo={incompleteTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("shows the checkbox as unchecked for an incomplete todo", () => {
    render(<TodoItem todo={incompleteTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("shows the checkbox as checked for a completed todo", () => {
    render(<TodoItem todo={completeTodo} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("calls onToggle with the todo id when the checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<TodoItem todo={incompleteTodo} onToggle={onToggle} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("checkbox"));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("calls onDelete with the todo id when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TodoItem todo={incompleteTodo} onToggle={vi.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
