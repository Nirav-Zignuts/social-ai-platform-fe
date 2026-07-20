"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CheckoutConfirmPhase } from "@/hooks/useRazorpayCheckout";

interface SubscriptionConfirmDialogProps {
  phase: CheckoutConfirmPhase;
  onRefresh: () => void;
  onDismiss: () => void;
  refreshing?: boolean;
}

export function SubscriptionConfirmDialog({
  phase,
  onRefresh,
  onDismiss,
  refreshing,
}: SubscriptionConfirmDialogProps) {
  const open = phase === "confirming" || phase === "confirmed" || phase === "pending";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && phase === "pending") onDismiss();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={phase === "pending"}>
        <DialogHeader>
          <DialogTitle>
            {phase === "confirmed"
              ? "Subscription confirmed"
              : phase === "pending"
                ? "Payment received"
                : "Confirming your subscription…"}
          </DialogTitle>
          <DialogDescription>
            {phase === "confirmed"
              ? "Your plan is active. Taking you to the dashboard."
              : phase === "pending"
                ? "Payment received — your subscription is being confirmed. This page will update automatically, or refresh status below."
                : "We’re waiting for confirmation from the payment provider. This usually takes a few seconds."}
          </DialogDescription>
        </DialogHeader>

        {(phase === "confirming" || phase === "confirmed") && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-8 animate-spin text-accent" />
          </div>
        )}

        {phase === "pending" && (
          <DialogFooter>
            <Button variant="outline" onClick={onDismiss}>
              Close
            </Button>
            <Button onClick={onRefresh} disabled={refreshing}>
              {refreshing ? "Checking…" : "Refresh status"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
