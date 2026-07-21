"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Settings,
  Inbox,
  LogOut,
  ChevronDown,
  Plus,
  Bell,
  Building2,
  Brain,
  Camera,
  BookOpen,
  Menu,
  X,
  Send,
  CreditCard,
  Receipt,
  Sparkles,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { isAtWorkspaceLimit } from "@/lib/plans";
import {
  hasPaidEntitlement,
  isWorkspaceLocked,
  listSelectableWorkspaces,
} from "@/lib/billing";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { getOnboardingResumePath } from "@/lib/onboarding";
import {
  buildWorkspaceSwitchHref,
  resolveActiveWorkspaceId,
  storeWorkspaceId,
  workspaceNeedsOnboarding,
} from "@/lib/workspace-routing";
import { WorkspaceUsageChip } from "@/components/billing/workspace-limit-banner";
import { WorkspaceSelectActiveDialog } from "@/components/billing/workspace-select-active-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  workspaceId?: string;
}

function AppShellInner({ children, workspaceId }: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: workspacesData } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const workspaces = workspacesData?.workspaces ?? [];
  const workspaceIds = workspaces.map((w) => w.id);
  const queryWorkspaceId = searchParams.get("workspace");

  const wsId = resolveActiveWorkspaceId({
    propId: workspaceId,
    pathname,
    queryWorkspaceId,
    workspaceIds,
  });

  const selectedWorkspace =
    workspaces.find((w) => w.id === wsId) ?? workspaces[0];

  // Keep last-selected workspace in sync for dashboard / fallbacks.
  useEffect(() => {
    if (wsId) storeWorkspaceId(wsId);
  }, [wsId]);

  // Incomplete onboarding must resume setup — don't linger on app pages.
  useEffect(() => {
    if (!selectedWorkspace || !workspaceNeedsOnboarding(selectedWorkspace)) {
      return;
    }
    if (
      pathname.startsWith("/settings/billing") ||
      pathname.startsWith("/pricing") ||
      pathname.startsWith("/onboarding")
    ) {
      return;
    }
    router.replace(getOnboardingResumePath(selectedWorkspace.id));
  }, [selectedWorkspace, pathname, router]);

  const { data: billingStatus } = useBillingStatus();
  const [pickerOpen, setPickerOpen] = useState(false);
  const workspaceLimit = billingStatus?.workspace_limit ?? 2;
  const visibleWorkspaces = listSelectableWorkspaces(workspaces);
  const activeWorkspaceCount =
    billingStatus?.active_workspace_count ??
    visibleWorkspaces.filter((w) => !isWorkspaceLocked(w)).length;
  const atWorkspaceLimit = isAtWorkspaceLimit(
    activeWorkspaceCount,
    workspaceLimit,
  );
  const onFreePlan = !hasPaidEntitlement(billingStatus);
  const currentLocked = Boolean(
    selectedWorkspace && isWorkspaceLocked(selectedWorkspace),
  );
  const needsWorkspaceSelection = Boolean(
    billingStatus?.needs_workspace_selection,
  );

  const closeMobileNav = () => setMobileNavOpen(false);

  const startCreateWorkspace = () => {
    closeMobileNav();
    if (atWorkspaceLimit) {
      router.push("/pricing");
      return;
    }
    router.push("/onboarding");
  };

  const switchWorkspace = (nextWorkspaceId: string) => {
    storeWorkspaceId(nextWorkspaceId);
    const next = workspaces.find((w) => w.id === nextWorkspaceId);
    const search = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";
    const href = buildWorkspaceSwitchHref(pathname, search, nextWorkspaceId, {
      onboardingStatus: next?.onboarding_status,
    });
    router.push(href);
    closeMobileNav();
  };

  const navItems = wsId
    ? [
        {
          href: `/dashboard?workspace=${wsId}`,
          label: "Dashboard",
          icon: LayoutDashboard,
          match: "/dashboard",
        },
        {
          href: `/workspaces/${wsId}/review`,
          label: "Review Inbox",
          icon: Inbox,
          match: "/review",
        },
        {
          href: `/workspaces/${wsId}/published`,
          label: "Published",
          icon: Send,
          match: "/published",
        },
        {
          href: `/workspaces/${wsId}/settings/knowledge-base`,
          label: "Knowledge Base",
          icon: BookOpen,
          match: "/knowledge-base",
        },
        {
          href: `/workspaces/${wsId}/settings/business-profile`,
          label: "Business Profile",
          icon: Building2,
          match: "/business-profile",
        },
        {
          href: `/workspaces/${wsId}/settings/ai-configuration`,
          label: "AI Configuration",
          icon: Brain,
          match: "/ai-configuration",
        },
        {
          href: `/workspaces/${wsId}/settings/instagram`,
          label: "Instagram",
          icon: Camera,
          match: "/instagram",
        },
        {
          href: `/workspaces/${wsId}/settings`,
          label: "Settings",
          icon: Settings,
          match: "/settings",
        },
      ]
    : [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          match: "/dashboard",
        },
      ];

  const isActive = (match: string) => {
    if (match === "/dashboard") return pathname === "/dashboard";
    if (match === "/settings") {
      return (
        /\/workspaces\/[^/]+\/settings\/?$/.test(pathname) ||
        (/\/workspaces\/[^/]+\/settings/.test(pathname) &&
          !pathname.includes("/knowledge-base") &&
          !pathname.includes("/business-profile") &&
          !pathname.includes("/ai-configuration") &&
          !pathname.includes("/instagram"))
      );
    }
    return pathname.includes(match);
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4 lg:justify-start">
        <Link
          href={wsId ? `/dashboard?workspace=${wsId}` : "/dashboard"}
          className="text-sm font-semibold tracking-tight text-text-primary"
          onClick={closeMobileNav}
        >
          Social AI
        </Link>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-surface-hover lg:hidden"
          onClick={closeMobileNav}
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="border-b border-border-subtle p-3">
        {visibleWorkspaces.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-left text-sm text-text-primary transition-colors duration-150 hover:bg-bg-surface-hover">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium">
                  {selectedWorkspace?.name ?? "Workspace"}
                </span>
                {currentLocked && (
                  <span className="shrink-0 rounded-full bg-bg-surface-hover px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-secondary">
                    Locked
                  </span>
                )}
              </span>
              <ChevronDown className="size-4 shrink-0 text-text-secondary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {visibleWorkspaces.map((ws) => {
                const locked = isWorkspaceLocked(ws);
                return (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={cn(
                      "flex items-center justify-between gap-2",
                      ws.id === wsId && "bg-bg-surface-hover",
                      locked && "opacity-70",
                    )}
                  >
                    <span
                      className={cn(
                        "truncate",
                        locked && "text-text-secondary",
                      )}
                    >
                      {ws.name}
                    </span>
                    {locked ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border-subtle px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-secondary">
                        <Lock className="size-2.5" />
                        Locked
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                );
              })}
              {(billingStatus?.locked_workspace_count ?? 0) > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      closeMobileNav();
                      if (needsWorkspaceSelection) {
                        setPickerOpen(true);
                      } else {
                        router.push("/pricing");
                      }
                    }}
                    className="text-accent"
                  >
                    <Sparkles className="mr-2 size-4" />
                    {needsWorkspaceSelection
                      ? "Choose active workspaces"
                      : "Upgrade to reactivate"}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={startCreateWorkspace}>
                <Plus className="mr-2 size-4" />
                {atWorkspaceLimit ? "Upgrade for more" : "New workspace"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            onClick={startCreateWorkspace}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border-subtle px-3 py-2 text-sm text-text-secondary transition-colors duration-150 hover:border-accent hover:text-text-primary"
          >
            <Plus className="size-4" />
            Create workspace
          </button>
        )}
        <WorkspaceUsageChip workspaceCount={activeWorkspaceCount} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileNav}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                active
                  ? "bg-bg-surface-hover font-medium text-text-primary"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", active && "text-accent")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border-subtle p-3">
        {onFreePlan && (
          <Link
            href="/pricing"
            onClick={closeMobileNav}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mb-1 w-full justify-start gap-2 border-accent/30 bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent",
            )}
          >
            <Sparkles className="size-4" />
            Upgrade
          </Link>
        )}
        <Link
          href="/pricing"
          onClick={closeMobileNav}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
            pathname.startsWith("/pricing")
              ? "bg-bg-surface-hover font-medium text-text-primary"
              : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
          )}
        >
          Pricing
        </Link>
        <Link
          href="/settings/billing"
          onClick={closeMobileNav}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
            pathname === "/settings/billing"
              ? "bg-bg-surface-hover font-medium text-text-primary"
              : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
          )}
        >
          <CreditCard className="size-4" />
          Billing
        </Link>
        <Link
          href="/settings/billing/transactions"
          onClick={closeMobileNav}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
            pathname.startsWith("/settings/billing/transactions")
              ? "bg-bg-surface-hover font-medium text-text-primary"
              : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
          )}
        >
          <Receipt className="size-4" />
          Billing history
        </Link>
        {wsId && (
          <Link
            href={`/workspaces/${wsId}/notifications`}
            onClick={closeMobileNav}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
              pathname.includes("/notifications")
                ? "bg-bg-surface-hover font-medium text-text-primary"
                : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
            )}
          >
            <Bell className="size-4" />
            Notifications
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary transition-colors duration-150 hover:bg-bg-surface-hover hover:text-text-primary">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-bg-base text-[10px] font-semibold uppercase text-text-secondary">
              {(user?.full_name ?? user?.email ?? "?").charAt(0)}
            </div>
            <span className="truncate">{user?.full_name ?? user?.email}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                router.push("/settings/billing");
                closeMobileNav();
              }}
            >
              <CreditCard className="mr-2 size-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                router.push("/settings/billing/transactions");
                closeMobileNav();
              }}
            >
              <Receipt className="mr-2 size-4" />
              Billing history
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                void logout();
              }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-bg-base">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border-subtle bg-bg-surface lg:flex">
        {sidebarContent}
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobileNav}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-border-subtle bg-bg-surface transition-transform duration-200 lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>

      <div className="flex min-h-screen w-full flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border-subtle bg-bg-base/95 px-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-text-secondary transition-colors duration-150 hover:bg-bg-surface-hover lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-medium text-text-primary">
              {selectedWorkspace?.name ?? "Social AI"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {wsId && <NotificationBell workspaceId={wsId} />}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {needsWorkspaceSelection && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-accent" />
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Choose which workspaces stay active.
                  </span>{" "}
                  Free allows {workspaceLimit} — pick the ones you want to keep
                  unlocked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              >
                Choose workspaces
              </button>
            </div>
          )}

          {currentLocked && !needsWorkspaceSelection && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-text-secondary" />
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">
                    This workspace is locked
                  </span>{" "}
                  — over your Free plan limit. Upgrade or change which
                  workspaces are active.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href="/pricing"
                  className={cn(buttonVariants({ size: "sm" }), "text-center")}
                >
                  Upgrade to reactivate
                </Link>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      <WorkspaceSelectActiveDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        limit={Math.max(1, workspaceLimit ?? 2)}
      />
    </div>
  );
}

export function AppShell({ children, workspaceId }: AppShellProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-base">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-bg-surface" />
        </div>
      }
    >
      <AppShellInner workspaceId={workspaceId}>{children}</AppShellInner>
    </Suspense>
  );
}
