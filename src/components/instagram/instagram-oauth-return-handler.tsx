"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

/**
 * Reads Instagram OAuth return query params and shows a normal dismissible
 * toast (same as the rest of the app). Clears params and routes to Instagram settings.
 */
export function InstagramOAuthReturnHandler() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const handledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handledRef.current) return;

    const pathname = window.location.pathname;
    let status = new URLSearchParams(window.location.search).get("instagram");
    let error = new URLSearchParams(window.location.search).get("error");

    // Also handle /login?redirect=/workspaces/.../settings?instagram=...
    if (!status && pathname === "/login") {
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
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

    handledRef.current = true;
    const workspaceId = getWorkspaceIdFromPath(pathname);

    if (status === "connected") {
      toast.success("Instagram connected successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
        queryClient.invalidateQueries({ queryKey: ["instagram", workspaceId] });
      }
    } else if (status === "error") {
      toast.error(decodeOAuthError(error ?? "Instagram connection failed"));
    }

    if (pathname === "/login") return;

    clearInstagramParams();

    // Backend lands on /settings — send users to the Instagram tab.
    if (
      workspaceId &&
      (pathname === `/workspaces/${workspaceId}/settings` ||
        pathname === `/workspaces/${workspaceId}/settings/`)
    ) {
      router.replace(`/workspaces/${workspaceId}/settings/instagram`);
    }
  }, [queryClient, router]);

  return null;
}
