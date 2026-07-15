"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Lightweight shell for onboarding only — avoids the full app sidebar
 * and its workspace queries so setup stays fast and focused.
 */
export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const { data } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const workspaces = data?.workspaces ?? [];
  const hasWorkspaces = workspaces.length > 0;
  const onboardingWorkspaceId =
    pathname.match(/^\/onboarding\/([^/]+)/)?.[1] ?? null;
  const completedWorkspace = workspaces.find(
    (w) => w.onboarding_status === "completed",
  );

  // Prefer a finished workspace for "Dashboard"; incomplete ones redirect back.
  const dashboardHref = completedWorkspace
    ? `/dashboard?workspace=${completedWorkspace.id}`
    : onboardingWorkspaceId
      ? `/dashboard?workspace=${onboardingWorkspaceId}`
      : "/dashboard";

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <header className="border-b border-border-subtle bg-bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={hasWorkspaces ? dashboardHref : "/onboarding"}
            className="text-sm font-semibold tracking-tight"
          >
            Social AI
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {hasWorkspaces && (
              <Link
                href={dashboardHref}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-text-secondary",
                )}
              >
                Dashboard
              </Link>
            )}
            <span className="hidden max-w-[160px] truncate text-caption sm:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
              )}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
