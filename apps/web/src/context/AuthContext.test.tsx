import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext.tsx";

function StatusProbe() {
  const { status, setAuthenticated } = useAuth();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <button onClick={() => setAuthenticated(true)}>set authenticated</button>
      <button onClick={() => setAuthenticated(false)}>set unauthenticated</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in loading status before the /api/auth/me response resolves", async () => {
    let resolveFetch!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }) as Promise<Response>,
    );

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("loading");

    // resolve to avoid an unhandled dangling promise across tests
    await act(async () => {
      resolveFetch({ json: () => Promise.resolve({ authenticated: false }) } as Response);
    });
  });

  it("sets status to authenticated when /api/auth/me reports authenticated: true", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: true }),
    } as Response);

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/auth/me");
  });

  it("sets status to unauthenticated when /api/auth/me reports authenticated: false", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: false }),
    } as Response);

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
  });

  it("fails closed to unauthenticated when the /api/auth/me fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network error"));

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
  });

  it("fails closed to unauthenticated when the /api/auth/me response body cannot be parsed", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.reject(new Error("invalid json")),
    } as Response);

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText("unauthenticated")).toBeInTheDocument();
  });

  it("lets setAuthenticated(true) mark status as authenticated directly", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: false }),
    } as Response);
    const user = (await import("@testing-library/user-event")).default.setup();

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    await screen.findByText("unauthenticated");
    await user.click(screen.getByRole("button", { name: "set authenticated" }));

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
  });

  it("lets setAuthenticated(false) mark status as unauthenticated directly", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: true }),
    } as Response);
    const user = (await import("@testing-library/user-event")).default.setup();

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    await screen.findByText("authenticated");
    await user.click(screen.getByRole("button", { name: "set unauthenticated" }));

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("sets status to unauthenticated when an 'auth:unauthorized' window event fires", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: true }),
    } as Response);

    render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    await screen.findByText("authenticated");

    act(() => {
      window.dispatchEvent(new Event("auth:unauthorized"));
    });

    expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
  });

  it("removes the 'auth:unauthorized' listener on unmount", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ authenticated: true }),
    } as Response);
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <AuthProvider>
        <StatusProbe />
      </AuthProvider>,
    );

    await screen.findByText("authenticated");
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("auth:unauthorized", expect.any(Function));
  });
});
