"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { isAtWorkspaceLimit, formatWorkspaceUsage } from "@/lib/plans";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceLimitBanner({
  workspaceCount,
}: {
  workspaceCount: number;
}) {
  const { data } = useBillingStatus();
  const limit = data?.workspace_limit ?? 2;
  const planName =
    data && (data.status === "cancelled" || data.status === "expired")
      ? "Free"
      : (data?.plan.name ?? "Free");
  const count = data?.active_workspace_count ?? workspaceCount;

  if (!isAtWorkspaceLimit(count, limit)) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/10 px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-surface text-accent">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              You&apos;ve reached your workspace limit ({limit}/{limit}) on the{" "}
              {planName} plan
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Upgrade to Pro for up to 10 workspaces. Your existing workspaces
              keep working as usual.
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className={cn(buttonVariants(), "shrink-0 text-center")}
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}

export function WorkspaceUsageChip({
  workspaceCount,
}: {
  workspaceCount: number;
}) {
  const { data } = useBillingStatus();
  const limit = data?.workspace_limit ?? 2;
  const count = data?.active_workspace_count ?? workspaceCount;

  if (!isAtWorkspaceLimit(count, limit)) return null;

  return (
    <p className="mt-2 px-1 text-[11px] text-text-secondary">
      {formatWorkspaceUsage(count, limit)}
    </p>
  );
}
