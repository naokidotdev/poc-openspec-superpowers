const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // ~24 hours

let sessions = new Map<string, { expiresAt: number }>();

export function createSession(): string {
  const id = crypto.randomUUID();
  sessions.set(id, { expiresAt: Date.now() + SESSION_TTL_MS });
  return id;
}

export function isValidSession(id: string): boolean {
  const session = sessions.get(id);
  if (!session) return false;
  if (Date.now() >= session.expiresAt) {
    sessions.delete(id);
    return false;
  }
  return true;
}

export function invalidateSession(id: string): void {
  sessions.delete(id);
}

export function resetSessions(): void {
  sessions = new Map();
}
