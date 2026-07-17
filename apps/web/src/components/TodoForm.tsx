import { useState, type FormEvent } from "react";

type TodoFormProps = {
  onSubmit: (title: string) => void;
};

export function TodoForm({ onSubmit }: TodoFormProps) {
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "") {
      return;
    }
    onSubmit(trimmed);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="todo-title">Title</label>
      <input
        id="todo-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button type="submit">Add</button>
    </form>
  );
}
