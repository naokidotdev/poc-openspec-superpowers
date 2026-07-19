import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./context/AuthContext.tsx";
import { RequireAuth } from "./components/RequireAuth.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { TodoPage } from "./pages/TodoPage.tsx";

// Split out from `App` so tests can render it inside a `MemoryRouter` (to
// control the starting path via `initialEntries`) instead of `BrowserRouter`.
export function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <TodoPage />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
