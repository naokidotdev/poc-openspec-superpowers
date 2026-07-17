import { describe, it, expect, beforeEach } from "vitest";
import { listTodos, addTodo, toggleTodo, deleteTodo, resetTodos } from "./store.ts";

describe("store", () => {
  beforeEach(() => {
    resetTodos();
  });

  it("starts empty after reset", () => {
    expect(listTodos()).toEqual([]);
  });

  it("adds a todo with completed: false and returns it", () => {
    const todo = addTodo("Buy milk");
    expect(todo.title).toBe("Buy milk");
    expect(todo.completed).toBe(false);
    expect(typeof todo.id).toBe("string");
    expect(todo.id.length).toBeGreaterThan(0);
    expect(typeof todo.createdAt).toBe("string");
  });

  it("lists all added todos", () => {
    addTodo("First");
    addTodo("Second");
    const todos = listTodos();
    expect(todos).toHaveLength(2);
    expect(todos.map((t) => t.title)).toEqual(["First", "Second"]);
  });

  it("toggles a todo's completed state from false to true", () => {
    const todo = addTodo("Buy milk");
    const updated = toggleTodo(todo.id, true);
    expect(updated?.completed).toBe(true);
    expect(listTodos()[0]?.completed).toBe(true);
  });

  it("toggles a todo's completed state from true to false", () => {
    const todo = addTodo("Buy milk");
    toggleTodo(todo.id, true);
    const updated = toggleTodo(todo.id, false);
    expect(updated?.completed).toBe(false);
  });

  it("returns undefined when toggling a nonexistent todo", () => {
    const result = toggleTodo("nonexistent-id", true);
    expect(result).toBeUndefined();
  });

  it("deletes an existing todo", () => {
    const todo = addTodo("Buy milk");
    const result = deleteTodo(todo.id);
    expect(result).toBe(true);
    expect(listTodos()).toEqual([]);
  });

  it("returns false when deleting a nonexistent todo", () => {
    const result = deleteTodo("nonexistent-id");
    expect(result).toBe(false);
  });
});
