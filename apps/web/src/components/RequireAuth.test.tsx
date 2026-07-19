import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { RequireAuth } from "./RequireAuth.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import type { AuthContextValue } from "../context/AuthContext.tsx";

vi.mock("../context/AuthContext.tsx", async () => {
  const actual = await vi.importActual<typeof import("../context/AuthContext.tsx")>("../context/AuthContext.tsx");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const mockedUseAuth = vi.mocked(useAuth);

function renderWithAuth(status: AuthContextValue["status"]) {
  mockedUseAuth.mockReturnValue({ status, setAuthenticated: vi.fn() });

  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <p>Protected content</p>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  it("renders nothing while status is loading", () => {
    renderWithAuth("loading");

    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("redirects to /login when status is unauthenticated", () => {
    renderWithAuth("unauthenticated");

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when status is authenticated", () => {
    renderWithAuth("authenticated");

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
