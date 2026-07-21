"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ClipboardList,
  Gauge,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROOT = "/ops-e246f9e101aae83bee9e9600-portal";

const NAV_ITEMS = [
  { label: "Dashboard", href: `${ROOT}/dashboard`, icon: LayoutDashboard },
  { label: "Users", href: `${ROOT}/users`, icon: Users },
  {
    label: "Contact Enquiries",
    href: `${ROOT}/contact-enquiries`,
    icon: Inbox,
  },
  { label: "AI Usage", href: `${ROOT}/ai-usage`, icon: Bot },
  { label: "Action Logs", href: `${ROOT}/action-logs`, icon: ClipboardList },
];

export function AdminShell({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const nav = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border-subtle px-4">
        <Link
          href={`${ROOT}/dashboard`}
          className="flex items-center gap-2.5"
          onClick={() => setMobileNavOpen(false)}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <ShieldCheck className="size-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-text-primary">
              Internal Operations
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-text-secondary">
              Admin gateway
            </span>
          </span>
        </Link>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-surface-hover lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close admin navigation"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `${ROOT}/dashboard` &&
              pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-bg-surface-hover font-medium text-text-primary"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary",
              )}
            >
              <Icon
                className={cn("size-4", active ? "text-accent" : undefined)}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start text-text-secondary"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-bg-base">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border-subtle bg-bg-surface lg:flex">
        {nav}
      </aside>

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close admin navigation"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(288px,85vw)] flex-col border-r border-border-subtle bg-bg-surface transition-transform lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {nav}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border-subtle bg-bg-base/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-surface-hover lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open admin navigation"
          >
            <Menu className="size-5" />
          </button>
          <Gauge className="hidden size-4 text-accent sm:block" />
          <p className="text-sm font-medium text-text-primary">
            Operations Console
          </p>
          <span className="ml-auto rounded-full border border-status-pending/30 bg-status-pending/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-status-pending">
            Internal
          </span>
        </header>
        <main className="w-full flex-1">{children}</main>
      </div>
    </div>
  );
}
