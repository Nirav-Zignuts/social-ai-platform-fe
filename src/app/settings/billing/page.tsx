"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Check } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  formatWorkspaceUsage,
  getPlan,
  getWorkspaceLimit,
} from "@/lib/plans";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function BillingSettingsPage() {
  const plan = getPlan();
  const limit = getWorkspaceLimit();

  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
  });

  const workspaceCount = data?.workspaces.length ?? 0;
  const usageRatio =
    limit == null || limit <= 0
      ? 0
      : Math.min(1, workspaceCount / limit);

  return (
    <AppShell>
      <PageHeader
        title="Billing"
        description="Your current plan and workspace usage across the account"
      />

      <div className="space-y-6">
        <section className="rounded-xl border border-border-subtle bg-bg-surface p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-caption">Current plan</p>
              <h2 className="mt-1 text-section-header">{plan.name}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {plan.priceLabel}
                {plan.billingPeriod ?? ""}
              </p>
            </div>
            <Link
              href="/pricing"
              className={cn(buttonVariants(), "shrink-0 text-center")}
            >
              Upgrade
            </Link>
          </div>

          <ul className="mt-6 space-y-2.5 border-t border-border-subtle pt-5">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-text-primary"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-status-approved"
                  strokeWidth={2.5}
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border-subtle bg-bg-surface p-6">
          <h3 className="text-sm font-medium text-text-primary">Usage</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {isLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              formatWorkspaceUsage(workspaceCount)
            )}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg-base">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300",
                usageRatio >= 1 ? "bg-status-pending" : "bg-accent",
              )}
              style={{ width: `${Math.max(usageRatio * 100, usageRatio > 0 ? 6 : 0)}%` }}
            />
          </div>
          <p className="mt-4 text-caption">
            Billing history will appear here once you upgrade.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
