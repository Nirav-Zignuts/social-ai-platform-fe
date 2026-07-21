"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { hasStoredSession } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/pricing",
  "/verify-email",
  "/instagram/callback-landing",
];

const ADMIN_HIDDEN_ROUTE_FAMILY =
  "/ops-e246f9e101aae83bee9e9600";

function subscribeToNothing() {
  return () => undefined;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.some(
      (route) => route !== "/" && pathname.startsWith(route),
    );
  // Admin routes have a separate token and enforce their own nested guard.
  // Let the hidden gateway and any nearby unknown paths render independently.
  // Unknown paths then reach Next's normal 404 instead of the main-app login.
  const isAdminGateway = pathname.startsWith(ADMIN_HIDDEN_ROUTE_FAMILY);
  const hasSession = mounted && hasStoredSession();

  useEffect(() => {
    if (!mounted) return;

    if (
      !isLoading &&
      isAuthenticated &&
      (pathname === "/login" || pathname === "/register")
    ) {
      const params = new URLSearchParams(window.location.search);
      if (params.has("access_token") || params.has("refresh_token")) {
        return;
      }
      router.replace(params.get("redirect") ?? "/dashboard");
      return;
    }

    if (isPublic || isAdminGateway) return;

    if (hasSession && isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [
    mounted,
    isAuthenticated,
    isLoading,
    isPublic,
    isAdminGateway,
    hasSession,
    pathname,
    router,
  ]);

  // Public routes render immediately — no auth bootstrap blocker.
  if (isPublic || isAdminGateway) {
    return <>{children}</>;
  }

  if (!mounted || (hasSession && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
