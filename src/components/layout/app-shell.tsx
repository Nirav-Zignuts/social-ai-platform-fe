"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import {
  getCurrentPlanId,
  isAtWorkspaceLimit,
} from "@/lib/plans";
import {
  WorkspaceUsageChip,
} from "@/components/billing/workspace-limit-banner";
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

export function AppShell({ children, workspaceId }: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: workspacesData } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
  });

  const workspaces = workspacesData?.workspaces ?? [];
  const selectedWorkspace =
    workspaces.find((w) => w.id === workspaceId) ?? workspaces[0];

  const wsId = selectedWorkspace?.id;
  const atWorkspaceLimit = isAtWorkspaceLimit(workspaces.length);
  const onFreePlan = getCurrentPlanId() === "free";

  const closeMobileNav = () => setMobileNavOpen(false);

  const startCreateWorkspace = () => {
    closeMobileNav();
    if (atWorkspaceLimit) {
      router.push("/pricing");
      return;
    }
    router.push("/onboarding");
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
        /\/workspaces\/[^/]+\/settings/.test(pathname) &&
        !pathname.includes("/knowledge-base") &&
        !pathname.includes("/business-profile") &&
        !pathname.includes("/ai-configuration") &&
        !pathname.includes("/instagram")
      );
    }
    return pathname.includes(match);
  };

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4 lg:justify-start">
        <Link
          href="/dashboard"
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
        {workspaces.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-left text-sm text-text-primary transition-colors duration-150 hover:bg-bg-surface-hover">
              <span className="truncate font-medium">
                {selectedWorkspace?.name ?? "Workspace"}
              </span>
              <ChevronDown className="size-4 shrink-0 text-text-secondary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => {
                    router.push(`/dashboard?workspace=${ws.id}`);
                    closeMobileNav();
                  }}
                >
                  {ws.name}
                </DropdownMenuItem>
              ))}
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
        <WorkspaceUsageChip workspaceCount={workspaces.length} />
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
            pathname.startsWith("/settings/billing")
              ? "bg-bg-surface-hover font-medium text-text-primary"
              : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
          )}
        >
          <CreditCard className="size-4" />
          Billing
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
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border-subtle bg-bg-surface lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
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

      {/* Main */}
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
          {children}
        </main>
      </div>
    </div>
  );
}
