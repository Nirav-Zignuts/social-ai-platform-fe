"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { hasStoredSession } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/pricing",
  "/instagram/callback-landing",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isPublic =
    pathname === "/" ||
    PUBLIC_ROUTES.some(
      (route) => route !== "/" && pathname.startsWith(route),
    );
  // Re-read on every render after mount so logout immediately drops session.
  const hasSession = mounted && hasStoredSession();

  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (isPublic) return;

    if (hasSession && isLoading) return;

    if (!isAuthenticated) {
      // Don't bounce through a redirect loop when already logging out to /login.
      router.replace("/login");
    }
  }, [
    mounted,
    isAuthenticated,
    isLoading,
    isPublic,
    hasSession,
    pathname,
    router,
  ]);

  if (!mounted) {
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

  if (!isPublic && hasSession && isLoading) {
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

  if (!isPublic && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
