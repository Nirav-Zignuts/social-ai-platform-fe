"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLANS, type Plan } from "@/lib/plans";
import { getEffectivePlanKey } from "@/lib/billing";
import { useAuth } from "@/hooks/use-auth";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { SubscriptionConfirmDialog } from "@/components/billing/subscription-confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function PlanCta({
  plan,
  effectivePlanKey,
  isAuthenticated,
  onUpgradePro,
  onContactSales,
  upgrading,
  checkoutUnavailable,
}: {
  plan: Plan;
  effectivePlanKey: string;
  isAuthenticated: boolean;
  onUpgradePro: () => void;
  onContactSales: () => void;
  upgrading: boolean;
  checkoutUnavailable: boolean;
}) {
  if (plan.id === "free") {
    if (isAuthenticated && effectivePlanKey === "free") {
      return (
        <Button className="w-full" variant="outline" disabled>
          Current plan
        </Button>
      );
    }
    if (isAuthenticated) {
      return (
        <Button className="w-full" variant="outline" disabled>
          Included
        </Button>
      );
    }
    return (
      <Link
        href="/register?redirect=/pricing"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        Get started free
      </Link>
    );
  }

  if (plan.id === "pro") {
    if (isAuthenticated && effectivePlanKey === "pro") {
      return (
        <Button className="w-full" disabled>
          Current plan
        </Button>
      );
    }
    if (!isAuthenticated) {
      return (
        <Link
          href="/login?redirect=/pricing"
          className={cn(buttonVariants(), "w-full text-center")}
        >
          Upgrade to Pro
        </Link>
      );
    }
    return (
      <Button
        className="w-full gap-2"
        disabled={upgrading || checkoutUnavailable}
        onClick={onUpgradePro}
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
    );
  }

  // Business — contact sales
  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={onContactSales}
    >
      Contact Sales
    </Button>
  );
}

export function PricingCards({ className }: { className?: string }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const billingQuery = useBillingStatus(isAuthenticated);
  const {
    openCheckout,
    isLoading: upgrading,
    confirmPhase,
    checkoutUnavailable,
    dismissConfirmPhase,
    refreshBillingStatus,
  } = useRazorpayCheckout({ redirectTo: "/dashboard" });

  const [salesOpen, setSalesOpen] = useState(false);
  const [email, setEmail] = useState("");

  const currentPlanKey = getEffectivePlanKey(billingQuery.data);

  return (
    <>
      <div
        className={cn(
          "grid gap-5 lg:grid-cols-3 lg:items-stretch",
          className,
        )}
      >
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-xl border bg-bg-surface p-6",
              plan.highlighted
                ? "border-accent lg:-translate-y-1 lg:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                : "border-border-subtle",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-6 rounded-full border border-accent/40 bg-bg-base px-2.5 py-0.5 text-[11px] font-medium text-accent">
                Most Popular
              </span>
            )}

            <div className="mb-6">
              <h2 className="text-sm font-medium text-text-secondary">
                {plan.name}
              </h2>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-text-primary">
                  {plan.priceLabel}
                </span>
                {plan.billingPeriod && (
                  <span className="text-sm text-text-secondary">
                    {plan.billingPeriod}
                  </span>
                )}
              </div>
            </div>

            <ul className="flex-1 space-y-3">
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

            <div className="mt-8">
              {!authLoading && (
                <PlanCta
                  plan={plan}
                  effectivePlanKey={currentPlanKey}
                  isAuthenticated={isAuthenticated}
                  upgrading={upgrading}
                  checkoutUnavailable={checkoutUnavailable}
                  onUpgradePro={() => openCheckout("pro")}
                  onContactSales={() => setSalesOpen(true)}
                />
              )}
            </div>
          </article>
        ))}
      </div>

      <SubscriptionConfirmDialog
        phase={confirmPhase}
        onDismiss={dismissConfirmPhase}
        onRefresh={() => void refreshBillingStatus()}
        refreshing={confirmPhase === "confirming"}
      />

      <Dialog open={salesOpen} onOpenChange={setSalesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Sales</DialogTitle>
            <DialogDescription>
              Business is sold with a dedicated account manager. Leave your
              email and we&apos;ll reach out about custom pricing and onboarding.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              console.log("[contact-sales]", { email, plan: "business" });
              toast.success("Thanks — our team will be in touch.");
              setEmail("");
              setSalesOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="sales-email">Work email</Label>
              <Input
                id="sales-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSalesOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Request contact</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
