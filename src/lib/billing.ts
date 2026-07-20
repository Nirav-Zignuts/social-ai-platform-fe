import type { BillingStatus, Workspace } from "@/lib/types";

/** Workspace is usable for gen/publish. */
export function isWorkspaceActive(workspace: Pick<Workspace, "status">) {
  return workspace.status === "active" || !workspace.status;
}

export function isWorkspaceLocked(workspace: Pick<Workspace, "status">) {
  return workspace.status === "locked_over_limit";
}

export function isDeletedWorkspace(workspace: Pick<Workspace, "status">) {
  return workspace.status === "deleted";
}

/** Paid plan still entitles the user (active/past_due, including cancel-at-period-end). */
export function hasPaidEntitlement(billing: BillingStatus | undefined | null) {
  if (!billing) return false;
  if (billing.plan.plan_key === "free") return false;
  return billing.status === "active" || billing.status === "past_due";
}

/**
 * Plan key for CTAs / "Current plan" badges.
 * Cancelled/expired → Free even if API still echoes an old plan row.
 */
export function getEffectivePlanKey(
  billing: BillingStatus | undefined | null,
): string {
  if (!billing) return "free";
  if (hasPaidEntitlement(billing)) return billing.plan.plan_key;
  return "free";
}

export function formatPriceInr(priceInr: number | null | undefined): string {
  if (priceInr == null || priceInr <= 0) return "₹0";
  // Seeded values may be paise (99900) or whole rupees (999 / 29).
  const rupees = priceInr >= 1000 ? priceInr / 100 : priceInr;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/** Razorpay amounts are minor units (paise for INR). */
export function formatAmountFromPaise(
  amountPaise: number | null | undefined,
  currency = "INR",
): string | null {
  if (amountPaise == null) return null;
  const rupees = amountPaise / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  } catch {
    return `₹${rupees.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function listSelectableWorkspaces(workspaces: Workspace[]) {
  return workspaces.filter((w) => !isDeletedWorkspace(w));
}
