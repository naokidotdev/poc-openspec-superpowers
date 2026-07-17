import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoForm } from "./TodoForm.tsx";

describe("TodoForm", () => {
  it("calls onSubmit with the trimmed title when a non-empty title is submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TodoForm onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: /title/i }), "  Buy milk  ");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("Buy milk");
  });

  it("clears the input after a successful submit", async () => {
    const user = userEvent.setup();
    render(<TodoForm onSubmit={vi.fn()} />);

    const input = screen.getByRole("textbox", { name: /title/i });
    await user.type(input, "Buy milk");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("");
  });

  it("does not call onSubmit when the title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TodoForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when the title is whitespace-only", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TodoForm onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: /title/i }), "   ");
    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
