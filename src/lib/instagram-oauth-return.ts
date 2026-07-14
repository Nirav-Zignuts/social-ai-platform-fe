const INSTAGRAM_OAUTH_RETURN_KEY = "instagram_oauth_return";

export type InstagramOAuthReturnTarget =
  | { type: "onboarding"; workspaceId: string }
  | { type: "settings"; workspaceId: string };

export function setInstagramOAuthReturn(target: InstagramOAuthReturnTarget) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INSTAGRAM_OAUTH_RETURN_KEY, JSON.stringify(target));
}

export function peekInstagramOAuthReturn(): InstagramOAuthReturnTarget | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(INSTAGRAM_OAUTH_RETURN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InstagramOAuthReturnTarget;
  } catch {
    return null;
  }
}

export function consumeInstagramOAuthReturn(): InstagramOAuthReturnTarget | null {
  const target = peekInstagramOAuthReturn();
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(INSTAGRAM_OAUTH_RETURN_KEY);
  }
  return target;
}

export function getInstagramOAuthReturnPath(
  target: InstagramOAuthReturnTarget,
): string {
  if (target.type === "onboarding") {
    return `/onboarding/${target.workspaceId}?step=scheduling`;
  }
  return `/workspaces/${target.workspaceId}/settings/instagram`;
}
