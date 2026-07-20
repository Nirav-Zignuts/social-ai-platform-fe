"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import type { BillingCheckoutSession, BillingStatus } from "@/lib/types";

const POLL_INTERVAL_MS = 2_000;
const POLL_ATTEMPTS = 7;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPaidSubscriptionActive(status: BillingStatus, planKey: string) {
  return (
    status.plan.plan_key === planKey &&
    (status.status === "active" || status.status === "past_due")
  );
}

function waitForRazorpay(timeoutMs = 4_000): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.Razorpay) {
        window.clearInterval(timer);
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
}

export type CheckoutConfirmPhase =
  | "idle"
  | "confirming"
  | "confirmed"
  | "pending";

export function useRazorpayCheckout(options?: {
  redirectTo?: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [confirmPhase, setConfirmPhase] =
    useState<CheckoutConfirmPhase>("idle");
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: (planKey: string) => api.billing.subscribe(planKey),
  });

  const pollUntilActive = useCallback(
    async (planKey: string): Promise<"confirmed" | "pending"> => {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        await sleep(POLL_INTERVAL_MS);
        try {
          const status = await api.billing.status();
          queryClient.setQueryData(["billing", "status"], status);
          if (isPaidSubscriptionActive(status, planKey)) {
            return "confirmed";
          }
        } catch {
          // Keep polling through transient errors.
        }
      }
      return "pending";
    },
    [queryClient],
  );

  const openCheckout = useCallback(
    async (planKey: string) => {
      setConfirmPhase("idle");
      setCheckoutUnavailable(false);

      const scriptReady = await waitForRazorpay();
      if (!scriptReady || !window.Razorpay) {
        setCheckoutUnavailable(true);
        toast.error(
          "Checkout is temporarily unavailable. Please refresh the page and try again.",
        );
        return;
      }

      let data: BillingCheckoutSession;
      try {
        data = await subscribeMutation.mutateAsync(planKey);
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Couldn’t start checkout. Please try again.",
        );
        return;
      }

      const Razorpay = window.Razorpay;
      const instance = new Razorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "Social AI",
        description: data.plan_name,
        theme: { color: "#6C5CE7" },
        prefill: {
          name: data.prefill?.name,
          email: data.prefill?.email,
          contact: data.prefill?.contact,
        },
        handler: () => {
          // Payment submitted — activation is webhook-driven. Poll status.
          void (async () => {
            setConfirmPhase("confirming");
            const result = await pollUntilActive(planKey);
            await queryClient.invalidateQueries({
              queryKey: ["billing", "status"],
            });
            if (result === "confirmed") {
              setConfirmPhase("confirmed");
              toast.success(`You're now on ${data.plan_name}`);
              window.setTimeout(() => {
                setConfirmPhase("idle");
                router.push(options?.redirectTo ?? "/dashboard");
              }, 900);
            } else {
              setConfirmPhase("pending");
            }
          })();
        },
        modal: {
          ondismiss: () => {
            // Normal cancel path — no error toast.
          },
        },
      });

      instance.open();
    },
    [
      options?.redirectTo,
      pollUntilActive,
      queryClient,
      router,
      subscribeMutation,
    ],
  );

  const dismissConfirmPhase = useCallback(() => {
    setConfirmPhase("idle");
  }, []);

  const refreshBillingStatus = useCallback(async () => {
    setConfirmPhase("confirming");
    try {
      const status = await api.billing.status();
      queryClient.setQueryData(["billing", "status"], status);
      if (status.plan.plan_key !== "free" && status.status === "active") {
        setConfirmPhase("confirmed");
        toast.success(`You're now on ${status.plan.name}`);
        window.setTimeout(() => {
          setConfirmPhase("idle");
          router.push(options?.redirectTo ?? "/dashboard");
        }, 900);
        return;
      }
      setConfirmPhase("pending");
    } catch (error) {
      setConfirmPhase("pending");
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Couldn’t refresh billing status",
      );
    }
  }, [options?.redirectTo, queryClient, router]);

  return {
    openCheckout,
    isLoading: subscribeMutation.isPending || confirmPhase === "confirming",
    confirmPhase,
    checkoutUnavailable,
    dismissConfirmPhase,
    refreshBillingStatus,
  };
}
