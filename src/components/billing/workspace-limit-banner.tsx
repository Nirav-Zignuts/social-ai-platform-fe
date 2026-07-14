"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  formatWorkspaceUsage,
  getPlan,
  isAtWorkspaceLimit,
} from "@/lib/plans";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceLimitBanner({
  workspaceCount,
}: {
  workspaceCount: number;
}) {
  if (!isAtWorkspaceLimit(workspaceCount)) return null;

  const plan = getPlan();
  const limit = plan.workspaceLimit;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/10 px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg-surface text-accent">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              You’ve reached your workspace limit ({limit}/{limit}) on the{" "}
              {plan.name} plan
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
  if (!isAtWorkspaceLimit(workspaceCount)) return null;

  return (
    <p className="mt-2 px-1 text-[11px] text-text-secondary">
      {formatWorkspaceUsage(workspaceCount)}
    </p>
  );
}
