/**
 * Marketing plan catalog + helpers.
 * Live entitlement (workspace limits, current plan) comes from GET /billing/status.
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
    priceLabel: "₹0",
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
    priceLabel: "₹29",
    billingPeriod: "/month",
    workspaceLimit: 10,
    features: [
      "Up to 10 workspaces",
      "Unlimited Instagram accounts",
      "AI-generated posts with human review",
      "Unlimited knowledge base documents",
      "Priority support",
      "Advanced analytics",
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
      "Yes. You can upgrade to Pro anytime from Pricing or Billing settings. Cancelling Pro keeps access until the end of the paid period, then you return to Free.",
  },
  {
    question: "What happens if I exceed my workspace limit?",
    answer:
      "You won’t be able to create additional workspaces until you upgrade or remove an existing one. Your current workspaces keep working normally.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Reach out to support if something went wrong with a charge — we’ll help case by case while we publish a formal refund policy.",
  },
  {
    question: "Is there a free trial for Pro?",
    answer:
      "Not yet. Start on Free with two workspaces, then upgrade to Pro when you need more room.",
  },
] as const;

export function getPlan(planId: PlanId | string): Plan {
  const plan = PLANS.find((item) => item.id === planId);
  if (!plan) {
    return PLANS[0];
  }
  return plan;
}

/** True when the user cannot create another workspace given a live limit. */
export function isAtWorkspaceLimit(
  workspaceCount: number,
  workspaceLimit: number | null | undefined,
): boolean {
  if (workspaceLimit == null) return false;
  return workspaceCount >= workspaceLimit;
}

export function shouldShowWorkspaceUsage(
  workspaceCount: number,
  workspaceLimit: number | null | undefined,
): boolean {
  if (workspaceLimit == null || workspaceLimit <= 0) return false;
  return workspaceCount >= workspaceLimit;
}

export function formatWorkspaceUsage(
  workspaceCount: number,
  workspaceLimit: number | null | undefined,
): string {
  if (workspaceLimit == null) {
    return `${workspaceCount} workspaces (Unlimited)`;
  }
  return `${workspaceCount} / ${workspaceLimit} workspaces used`;
}

export function formatBillingPeriodDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
