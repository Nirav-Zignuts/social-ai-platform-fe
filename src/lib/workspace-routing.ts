/**
 * Helpers for keeping the current route when switching workspaces.
 */

const LAST_WORKSPACE_KEY = "social_ai_last_workspace_id";

export function getStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_WORKSPACE_KEY);
}

export function storeWorkspaceId(workspaceId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_WORKSPACE_KEY, workspaceId);
}

export function clearStoredWorkspaceId(workspaceId?: string) {
  if (typeof window === "undefined") return;
  if (!workspaceId || getStoredWorkspaceId() === workspaceId) {
    localStorage.removeItem(LAST_WORKSPACE_KEY);
  }
}

/** Extract /workspaces/:id from a pathname. */
export function getWorkspaceIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/workspaces\/([^/]+)/);
  return match?.[1] ?? null;
}

/**
 * Build a URL that keeps the user on the same page type for a different workspace.
 * e.g. /workspaces/A/settings/instagram → /workspaces/B/settings/instagram
 */
export function buildWorkspaceSwitchHref(
  pathname: string,
  search: string,
  newWorkspaceId: string,
): string {
  const pathWs = getWorkspaceIdFromPathname(pathname);
  if (pathWs) {
    const nextPath = pathname.replace(
      `/workspaces/${pathWs}`,
      `/workspaces/${newWorkspaceId}`,
    );
    return nextPath;
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return `/dashboard?workspace=${encodeURIComponent(newWorkspaceId)}`;
  }

  // Global pages (billing, pricing) — remember workspace, stay put.
  if (
    pathname.startsWith("/settings/billing") ||
    pathname.startsWith("/pricing")
  ) {
    return `${pathname}${search}`;
  }

  return `/dashboard?workspace=${encodeURIComponent(newWorkspaceId)}`;
}

export function resolveActiveWorkspaceId(options: {
  propId?: string | null;
  pathname: string;
  queryWorkspaceId?: string | null;
  workspaceIds: string[];
}): string | undefined {
  const { propId, pathname, queryWorkspaceId, workspaceIds } = options;
  if (workspaceIds.length === 0) return undefined;

  const candidates = [
    propId,
    getWorkspaceIdFromPathname(pathname),
    queryWorkspaceId,
    getStoredWorkspaceId(),
    workspaceIds[0],
  ];

  for (const candidate of candidates) {
    if (candidate && workspaceIds.includes(candidate)) {
      return candidate;
    }
  }

  return workspaceIds[0];
}
