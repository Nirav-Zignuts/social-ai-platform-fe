"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import {
  consumeInstagramOAuthReturn,
  peekInstagramOAuthReturn,
  getInstagramOAuthReturnPath,
  type InstagramOAuthReturnTarget,
} from "@/lib/instagram-oauth-return";
import { isOnboardingComplete } from "@/lib/onboarding";
import type { Workspace } from "@/lib/types";

/** Survives Strict Mode remount for a single OAuth redirect. */
let oauthFlightKey: string | null = null;
let oauthToastShownForKey: string | null = null;

function decodeOAuthError(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function getWorkspaceIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/workspaces\/([^/]+)/);
  return match?.[1];
}

function clearInstagramParams() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("instagram") && !url.searchParams.has("error")) {
    return;
  }
  url.searchParams.delete("instagram");
  url.searchParams.delete("error");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}

function isSettingsLanding(pathname: string, workspaceId: string) {
  return (
    pathname === `/workspaces/${workspaceId}/settings` ||
    pathname === `/workspaces/${workspaceId}/settings/` ||
    pathname.startsWith(`/workspaces/${workspaceId}/settings/instagram`)
  );
}

function resolveReturnPath(
  returnTarget: InstagramOAuthReturnTarget | null,
  workspaceId: string | undefined,
  pathname: string,
  onboardingIncomplete: boolean | null,
): string | null {
  if (returnTarget) {
    return getInstagramOAuthReturnPath(returnTarget);
  }
  if (!workspaceId || !isSettingsLanding(pathname, workspaceId)) {
    return null;
  }
  if (onboardingIncomplete) {
    return `/onboarding/${workspaceId}?step=scheduling`;
  }
  return `/workspaces/${workspaceId}/settings/instagram`;
}

/**
 * Handles BE redirects with ?instagram=connected|error.
 * Onboarding connect → /onboarding/{id}?step=scheduling (stepper retained).
 * Settings connect → Instagram settings panel.
 */
export function InstagramOAuthReturnHandler() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    const search = window.location.search;
    let status = new URLSearchParams(search).get("instagram");
    let error = new URLSearchParams(search).get("error");

    if (!status && pathname === "/login") {
      const redirect = new URLSearchParams(search).get("redirect");
      if (redirect) {
        try {
          const redirectUrl = new URL(redirect, window.location.origin);
          status = redirectUrl.searchParams.get("instagram");
          error = redirectUrl.searchParams.get("error");
        } catch {
          // ignore malformed redirect
        }
      }
    }

    if (!status) return;

    const flightKey = `${pathname}${search}|${status}`;
    if (oauthFlightKey === flightKey) return;
    oauthFlightKey = flightKey;

    let cancelled = false;

    async function routeAfterOAuth() {
      // Peek first so Strict Mode remount can still read intent.
      const returnTarget = peekInstagramOAuthReturn();
      const workspaceId =
        returnTarget?.workspaceId ?? getWorkspaceIdFromPath(pathname);

      if (oauthToastShownForKey !== flightKey) {
        oauthToastShownForKey = flightKey;
        if (status === "connected") {
          toast.success("Instagram connected successfully");
          if (workspaceId) {
            queryClient.invalidateQueries({
              queryKey: ["workspace", workspaceId],
            });
            queryClient.invalidateQueries({
              queryKey: ["instagram", workspaceId],
            });
          }
        } else if (status === "error") {
          toast.error(decodeOAuthError(error ?? "Instagram connection failed"));
        }
      }

      if (pathname === "/login") {
        consumeInstagramOAuthReturn();
        return;
      }

      let onboardingIncomplete: boolean | null = null;

      if (
        !returnTarget &&
        workspaceId &&
        isSettingsLanding(pathname, workspaceId)
      ) {
        try {
          const cached = queryClient.getQueryData<{ workspace: Workspace }>([
            "workspace",
            workspaceId,
          ]);
          const workspace =
            cached?.workspace ??
            (await api.workspaces.get(workspaceId)).workspace;
          onboardingIncomplete = !isOnboardingComplete(
            workspace.onboarding_status,
          );
        } catch {
          onboardingIncomplete = false;
        }
      }

      if (cancelled) {
        oauthFlightKey = null;
        return;
      }

      const nextPath = resolveReturnPath(
        returnTarget,
        workspaceId,
        pathname,
        onboardingIncomplete,
      );

      consumeInstagramOAuthReturn();
      clearInstagramParams();

      if (nextPath) {
        router.replace(nextPath);
      }
    }

    void routeAfterOAuth();

    return () => {
      cancelled = true;
      // Allow the remount effect to take over if we never routed.
      if (oauthFlightKey === flightKey) {
        oauthFlightKey = null;
      }
    };
  }, [queryClient, router]);

  return null;
}
