/**
 * Single source of truth for product plans.
 *
 * TODO(billing): Replace getCurrentPlanId() with real subscription state from
 * the backend once Stripe (or equivalent) is wired up. Until then every user
 * is treated as being on the Free plan.
 */

export type PlanId = "free" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  price: number | null;
  priceLabel: string;
  billingPeriod: string | null;
  workspaceLimit: number | null;
  features: readonly string[];
  cta: string;
  highlighted: boolean;
};

export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    billingPeriod: null,
    workspaceLimit: 2,
    features: [
      "Up to 2 workspaces",
      "1 Instagram account per workspace",
      "Conversational brand profile setup",
      "AI-generated posts with human review",
      "Knowledge base (up to 3 documents per workspace)",
      "Community support",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    priceLabel: "$29",
    billingPeriod: "/month",
    workspaceLimit: 10,
    features: [
      "Up to 10 workspaces",
      "Unlimited Instagram accounts",
      "AI-generated posts with human review",
      "Unlimited knowledge base documents",
      "Priority support",
      "Advanced analytics (coming soon)",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: null,
    priceLabel: "Custom",
    billingPeriod: null,
    workspaceLimit: null,
    features: [
      "Unlimited workspaces",
      "Unlimited Instagram accounts",
      "Dedicated account manager",
      "Custom AI configuration & fine-tuning",
      "SLA-backed support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const satisfies readonly Plan[];

export const PRICING_FAQ = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes. You can upgrade or downgrade at any time. When billing goes live, changes will apply to your next billing cycle.",
  },
  {
    question: "What happens if I exceed my workspace limit?",
    answer:
      "You won’t be able to create additional workspaces until you upgrade or remove an existing one. Your current workspaces keep working normally.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We’ll publish a clear refund policy with paid billing. For early access conversations, reach out and we’ll help case by case.",
  },
  {
    question: "Is there a free trial for Pro?",
    answer:
      "Not yet. While billing is in preview, Free remains available so you can evaluate the product. Pro early access will open soon.",
  },
] as const;

/** TODO(billing): read from authenticated user / subscription API. */
export function getCurrentPlanId(): PlanId {
  return "free";
}

export function getPlan(planId: PlanId = getCurrentPlanId()): Plan {
  const plan = PLANS.find((item) => item.id === planId);
  if (!plan) {
    return PLANS[0];
  }
  return plan;
}

export function getWorkspaceLimit(
  planId: PlanId = getCurrentPlanId(),
): number | null {
  return getPlan(planId).workspaceLimit;
}

/** True when the user cannot create another workspace on their plan. */
export function isAtWorkspaceLimit(
  workspaceCount: number,
  planId: PlanId = getCurrentPlanId(),
): boolean {
  const limit = getWorkspaceLimit(planId);
  if (limit == null) return false;
  return workspaceCount >= limit;
}

/**
 * Show a small usage chip only when the user is at their limit.
 * Avoid clutter while they still have room (e.g. 0–1 of 2 on Free).
 */
export function shouldShowWorkspaceUsage(
  workspaceCount: number,
  planId: PlanId = getCurrentPlanId(),
): boolean {
  const limit = getWorkspaceLimit(planId);
  if (limit == null || limit <= 0) return false;
  return workspaceCount >= limit;
}

export function formatWorkspaceUsage(
  workspaceCount: number,
  planId: PlanId = getCurrentPlanId(),
): string {
  const limit = getWorkspaceLimit(planId);
  if (limit == null) {
    return `${workspaceCount} workspaces`;
  }
  return `${workspaceCount} / ${limit} workspaces used`;
}
