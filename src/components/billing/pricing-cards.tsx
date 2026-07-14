"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PLANS, type Plan } from "@/lib/plans";
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
  onRequestAccess,
}: {
  plan: Plan;
  onRequestAccess: (plan: Plan) => void;
}) {
  if (plan.id === "free") {
    return (
      <Link
        href="/register"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        Get started free
      </Link>
    );
  }

  return (
    <Button
      className="w-full"
      variant={plan.highlighted ? "default" : "outline"}
      onClick={() => onRequestAccess(plan)}
    >
      {plan.cta}
    </Button>
  );
}

export function PricingCards({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState("");

  const requestAccess = (plan: Plan) => {
    setSelectedPlan(plan);
    setOpen(true);
  };

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
              <PlanCta plan={plan} onRequestAccess={requestAccess} />
            </div>
          </article>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Billing isn’t live yet</DialogTitle>
            <DialogDescription>
              This is a preview of our upcoming{" "}
              {selectedPlan?.name ?? "paid"} plan. Leave your email if you want
              early access when payments open.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              // Preview-only: no backend. Logged for handoff / QA.
              console.log("[early-access]", {
                email,
                plan: selectedPlan?.id,
              });
              toast.success("Thanks — we’ll be in touch when billing opens.");
              setEmail("");
              setOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="early-access-email">Email</Label>
              <Input
                id="early-access-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Request early access</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
