import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { LoginPage } from "./LoginPage.tsx";
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

function renderLoginPage() {
  const setAuthenticated = vi.fn();
  mockedUseAuth.mockReturnValue({ status: "unauthenticated", setAuthenticated } satisfies AuthContextValue);

  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>,
  );

  return { setAuthenticated };
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("masks the password input", () => {
    renderLoginPage();

    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
  });

  it("logs in successfully: posts credentials, updates auth state, and navigates to /", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    } as Response);

    const { setAuthenticated } = renderLoginPage();

    await user.type(screen.getByLabelText(/id/i), "alice");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: "alice", password: "secret" }),
    });
    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(setAuthenticated).toHaveBeenCalledWith(true);
  });

  it("shows the server error message and stays on the login page when login fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "id or password is incorrect" }),
    } as Response);

    const { setAuthenticated } = renderLoginPage();

    await user.type(screen.getByLabelText(/id/i), "alice");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("id or password is incorrect")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
    expect(setAuthenticated).not.toHaveBeenCalled();
  });

  it("shows a generic Japanese fallback error when the failure response has no error body", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("no body")),
    } as Response);

    renderLoginPage();

    await user.type(screen.getByLabelText(/id/i), "alice");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("ログインに失敗しました")).toBeInTheDocument();
  });

  it("shows a generic error and stays on the login page when the fetch itself rejects", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValue(new Error("network error"));

    const { setAuthenticated } = renderLoginPage();

    await user.type(screen.getByLabelText(/id/i), "alice");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText("ログインに失敗しました")).toBeInTheDocument();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
    expect(setAuthenticated).not.toHaveBeenCalled();
  });

  it("disables the submit button while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }) as Promise<Response>,
    );

    renderLoginPage();

    await user.type(screen.getByLabelText(/id/i), "alice");
    await user.type(screen.getByLabelText(/password/i), "secret");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByRole("button", { name: /log in/i })).toBeDisabled();

    // resolve to avoid an unhandled dangling promise across tests
    await act(async () => {
      resolveFetch({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) } as Response);
    });
  });
});
