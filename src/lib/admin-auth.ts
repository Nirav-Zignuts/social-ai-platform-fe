export const ADMIN_SESSION_TOKEN_KEY = "admin_session_token";
export const ADMIN_SESSION_EXPIRED_EVENT = "admin-session-expired";
export const ADMIN_SESSION_CHANGED_EVENT = "admin-session-changed";

export function getAdminSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
}

export function setAdminSessionToken(token: string): void {
  localStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
  window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
}

export function clearAdminSessionToken(): void {
  localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_SESSION_CHANGED_EVENT));
  }
}

export function notifyAdminSessionExpired(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
}

export function isAdminSessionTokenValid(token: string | null): boolean {
  // Admin sessions are encrypted five-part JWEs, so their expiry cannot be
  // inspected in the browser. The backend remains the authority on validity.
  return Boolean(token?.trim());
}
