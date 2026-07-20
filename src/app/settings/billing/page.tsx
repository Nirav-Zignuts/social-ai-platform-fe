"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, Check, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import {
  formatPriceInr,
  getEffectivePlanKey,
  hasPaidEntitlement,
} from "@/lib/billing";
import {
  formatBillingPeriodDate,
  formatWorkspaceUsage,
  getPlan,
} from "@/lib/plans";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { SubscriptionConfirmDialog } from "@/components/billing/subscription-confirm-dialog";
import { WorkspaceSelectActiveDialog } from "@/components/billing/workspace-select-active-dialog";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function statusLabel(
  status: string,
  cancelAtPeriodEnd: boolean,
  periodLabel: string,
) {
  if (cancelAtPeriodEnd && status === "active") {
    return periodLabel ? `Cancels on ${periodLabel}` : "Cancels at period end";
  }
  if (status === "past_due") return "Past due";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  return "Active";
}

function statusClass(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd && status === "active") return "text-status-pending";
  if (status === "past_due") return "text-status-pending";
  if (status === "cancelled" || status === "expired") {
    return "text-status-rejected";
  }
  return "text-status-approved";
}

export default function BillingSettingsPage() {
  const queryClient = useQueryClient();
  const billingQuery = useBillingStatus();
  const {
    openCheckout,
    isLoading: upgrading,
    confirmPhase,
    checkoutUnavailable,
    dismissConfirmPhase,
    refreshBillingStatus,
  } = useRazorpayCheckout({ redirectTo: "/settings/billing" });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const data = billingQuery.data;
  const effectivePlanKey = getEffectivePlanKey(data);
  const paidAccess = hasPaidEntitlement(data);
  const catalogPlan = getPlan(effectivePlanKey);
  const limit = data?.workspace_limit ?? null;
  const workspaceCount = data?.workspace_count ?? 0;
  const usageRatio =
    limit == null || limit <= 0 ? 0 : Math.min(1, workspaceCount / limit);
  const periodLabel = formatBillingPeriodDate(data?.current_period_end);
  const canCancel =
    paidAccess &&
    data?.plan.plan_key === "pro" &&
    !data.cancel_at_period_end;
  const needsSelection = Boolean(data?.needs_workspace_selection);
  const selectionLimit = Math.max(1, data?.workspace_limit ?? 2);

  useEffect(() => {
    if (needsSelection && !pickerOpen) {
      // Soft prompt via banner; don't auto-force modal every render.
    }
  }, [needsSelection, pickerOpen]);

  const cancelMutation = useMutation({
    mutationFn: (immediate: boolean) => api.billing.cancel({ immediate }),
    onSuccess: async (_result, immediate) => {
      setCancelOpen(false);
      setCancelImmediate(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["billing", "status"] }),
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
      ]);
      const refreshed = await queryClient.fetchQuery({
        queryKey: ["billing", "status"],
        queryFn: () => api.billing.status(),
      });

      if (immediate) {
        toast.success("Subscription cancelled");
        if (refreshed.needs_workspace_selection) {
          setPickerOpen(true);
        }
      } else {
        const ends = formatBillingPeriodDate(refreshed.current_period_end);
        toast.success(
          ends
            ? `Cancellation scheduled — you keep Pro until ${ends}`
            : "Cancellation scheduled for the end of your billing period",
        );
      }
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Couldn’t cancel subscription",
      );
    },
  });

  return (
    <AppShell>
      <PageHeader
        title="Billing"
        description="Your current plan and workspace usage across the account"
      />

      {billingQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : billingQuery.isError ? (
        <div className="rounded-xl border border-status-rejected/30 bg-status-rejected/5 px-5 py-6 text-center">
          <p className="text-sm text-text-secondary">
            Couldn&apos;t load billing status.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => billingQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {data.status === "past_due" && (
            <div className="flex gap-3 rounded-xl border border-status-pending/40 bg-status-pending/10 px-5 py-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-status-pending" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Your last payment failed
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Please update your payment method to avoid losing access to
                  Pro features.
                </p>
              </div>
            </div>
          )}

          {needsSelection && (
            <div className="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <Lock className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    You have more workspaces than Free allows
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {(data.locked_workspace_count ?? 0) > 0
                      ? `${data.locked_workspace_count ?? 0} locked · ${data.active_workspace_count ?? 0} active`
                      : `Choose up to ${selectionLimit} to keep active`}
                    . The rest stay locked until you upgrade or change your
                    selection.
                  </p>
                </div>
              </div>
              <Button
                className="shrink-0"
                onClick={() => setPickerOpen(true)}
              >
                Choose workspaces
              </Button>
            </div>
          )}

          {!needsSelection &&
            (data.locked_workspace_count ?? 0) > 0 &&
            effectivePlanKey === "free" && (
              <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-text-secondary">
                  {data.locked_workspace_count ?? 0} workspace
                  {(data.locked_workspace_count ?? 0) === 1 ? "" : "s"} locked
                  over the Free limit.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  Manage active workspaces
                </Button>
              </div>
            )}

          <section className="rounded-xl border border-border-subtle bg-bg-surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-caption">Current plan</p>
                <h2 className="mt-1 text-section-header">
                  {paidAccess ? data.plan.name : "Free"}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {paidAccess
                    ? `${formatPriceInr(data.plan.price_inr)}/month`
                    : "₹0"}
                </p>
                <p
                  className={cn(
                    "mt-2 text-sm font-medium",
                    statusClass(data.status, data.cancel_at_period_end),
                  )}
                >
                  {statusLabel(
                    data.status,
                    data.cancel_at_period_end,
                    periodLabel,
                  )}
                  {!data.cancel_at_period_end &&
                  paidAccess &&
                  data.current_period_end
                    ? ` · Renews on ${periodLabel}`
                    : ""}
                </p>
                {data.cancel_at_period_end && paidAccess && (
                  <p className="mt-2 text-caption">
                    You keep Pro benefits until the period ends. After that,
                    Free limits apply and you may need to choose which
                    workspaces stay active.
                  </p>
                )}
                {(data.status === "cancelled" || data.status === "expired") &&
                  !paidAccess && (
                    <p className="mt-2 text-caption">
                      Your paid subscription has ended. You&apos;re on Free
                      now
                      {periodLabel ? ` (ended ${periodLabel})` : ""}.
                    </p>
                  )}
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                {!paidAccess && (
                  <Button
                    className="gap-2"
                    disabled={upgrading || checkoutUnavailable}
                    onClick={() => openCheckout("pro")}
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Starting checkout…
                      </>
                    ) : checkoutUnavailable ? (
                      "Checkout unavailable — refresh"
                    ) : (
                      "Upgrade to Pro"
                    )}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel subscription
                  </Button>
                )}
                <Link
                  href="/pricing"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-text-secondary",
                  )}
                >
                  View all plans
                </Link>
              </div>
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-border-subtle pt-5">
              {catalogPlan.features.map((feature) => (
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-text-primary">
                  Billing history
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Charges, renewals, and subscription events from Razorpay.
                </p>
              </div>
              <Link
                href="/settings/billing/transactions"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover"
              >
                View transactions
                <ArrowUpRight className="size-3.5 text-text-muted" />
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-border-subtle bg-bg-surface p-6">
            <h3 className="text-sm font-medium text-text-primary">Usage</h3>
            <p className="mt-1 text-sm text-text-secondary">
              {formatWorkspaceUsage(workspaceCount, limit)}
              {typeof data.active_workspace_count === "number" &&
                typeof data.locked_workspace_count === "number" &&
                data.locked_workspace_count > 0 && (
                  <>
                    {" "}
                    · {data.active_workspace_count} active ·{" "}
                    {data.locked_workspace_count} locked
                  </>
                )}
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg-base">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300",
                  usageRatio >= 1 ? "bg-status-pending" : "bg-accent",
                )}
                style={{
                  width: `${Math.max(usageRatio * 100, usageRatio > 0 ? 6 : 0)}%`,
                }}
              />
            </div>
          </section>
        </div>
      ) : null}

      <SubscriptionConfirmDialog
        phase={confirmPhase}
        onDismiss={dismissConfirmPhase}
        onRefresh={() => void refreshBillingStatus()}
        refreshing={confirmPhase === "confirming"}
      />

      <WorkspaceSelectActiveDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        limit={selectionLimit}
      />

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open);
          if (!open) setCancelImmediate(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Pro subscription?</DialogTitle>
            <DialogDescription>
              {cancelImmediate
                ? "Pro ends now and Free limits apply immediately. If you have more than 2 workspaces, you’ll choose which stay active."
                : `You'll keep Pro until${
                    periodLabel ? ` ${periodLabel}` : " the period ends"
                  }. No workspaces are locked yet — that happens after access ends.`}
            </DialogDescription>
          </DialogHeader>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-bg-base px-3 py-3">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 rounded border-border-subtle accent-accent"
              checked={cancelImmediate}
              onChange={(event) => setCancelImmediate(event.target.checked)}
              disabled={cancelMutation.isPending}
            />
            <span className="min-w-0">
              <Label className="cursor-pointer text-sm font-medium text-text-primary">
                Cancel immediately
              </Label>
              <p className="mt-0.5 text-caption">
                Recommended: leave unchecked to cancel at period end.
              </p>
            </span>
          </label>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancelMutation.isPending}
            >
              Keep Pro
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate(cancelImmediate)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? "Cancelling…"
                : cancelImmediate
                  ? "Cancel now"
                  : "Cancel at period end"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
