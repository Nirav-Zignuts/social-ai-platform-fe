"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Filter,
  Receipt,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useBillingTransactions } from "@/hooks/useBillingTransactions";
import { formatAmountFromPaise } from "@/lib/billing";
import { getPlan } from "@/lib/plans";
import type {
  BillingPaymentEvent,
  BillingPaymentMethod,
} from "@/lib/types";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const EVENT_FILTERS = [
  { value: "subscription.charged", label: "Charged" },
  { value: "subscription.activated", label: "Activated" },
  { value: "subscription.cancelled", label: "Cancelled" },
  { value: "subscription.pending", label: "Pending" },
  { value: "subscription.halted", label: "Halted" },
  { value: "subscription.completed", label: "Completed" },
] as const;

type ProcessedFilter = "all" | "true" | "false";

function eventTone(eventType: string) {
  if (eventType.includes("charged") || eventType.includes("activated")) {
    return "ok";
  }
  if (
    eventType.includes("cancelled") ||
    eventType.includes("halted") ||
    eventType.includes("failed")
  ) {
    return "danger";
  }
  if (eventType.includes("pending")) return "warn";
  return "default";
}

function statusTone(status: string | null | undefined) {
  if (!status) return "default";
  if (status === "active") return "ok";
  if (status === "cancelled" || status === "halted") return "danger";
  if (status === "pending" || status === "authenticated") return "warn";
  return "default";
}

function friendlyEventTitle(eventType: string) {
  const map: Record<string, string> = {
    "subscription.charged": "Payment charged",
    "subscription.activated": "Subscription activated",
    "subscription.cancelled": "Subscription cancelled",
    "subscription.pending": "Subscription pending",
    "subscription.halted": "Subscription halted",
    "subscription.completed": "Subscription completed",
    "subscription.paused": "Subscription paused",
    "subscription.resumed": "Subscription resumed",
  };
  if (map[eventType]) return map[eventType];
  return eventType
    .replace(/^subscription\./, "")
    .replace(/^payment\./, "")
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatUnixDate(unix: number | null | undefined) {
  if (unix == null || unix <= 0) return "—";
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPlanName(name: string | null | undefined) {
  if (!name) return null;
  return getPlan(name).name;
}

function formatCardLabel(method: BillingPaymentMethod) {
  const last4 = method.number?.replace(/\D/g, "").slice(-4);
  const network = method.network?.toUpperCase();
  if (network && last4) return `${network} •••• ${last4}`;
  if (method.number) return method.number;
  if (network) return network;
  return "Card on file";
}

function formatCardType(method: BillingPaymentMethod) {
  const type = method.type?.replace(/_/g, " ");
  if (!type) return null;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function fromDateInputValue(value: string, endOfDay = false) {
  if (!value) return undefined;
  return endOfDay ? `${value}T23:59:59Z` : `${value}T00:00:00Z`;
}

function ToneBadge({
  tone,
  children,
}: {
  tone: "ok" | "danger" | "warn" | "default";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
        tone === "ok" && "bg-status-approved/15 text-status-approved",
        tone === "danger" && "bg-status-rejected/15 text-status-rejected",
        tone === "warn" && "bg-status-pending/15 text-status-pending",
        tone === "default" && "bg-bg-surface-hover text-text-secondary",
      )}
    >
      {children}
    </span>
  );
}

function PaymentMethodCard({ method }: { method: BillingPaymentMethod }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-base/60 px-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <CreditCard className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">
          {formatCardLabel(method)}
        </p>
        <p className="mt-0.5 text-caption">
          {[formatCardType(method), method.issuer].filter(Boolean).join(" · ") ||
            "Payment method"}
        </p>
      </div>
    </div>
  );
}

function TransactionRow({ event }: { event: BillingPaymentEvent }) {
  const [open, setOpen] = useState(false);
  const planName = formatPlanName(event.name);
  const subscriptionId = event.entity?.id ?? null;
  const periodEnd = event.entity?.current_end;
  const method = event.payment_method;
  const title = friendlyEventTitle(event.event_type);
  const tone = eventTone(event.event_type);
  const amountLabel = formatAmountFromPaise(
    event.amount,
    event.currency ?? "INR",
  );

  return (
    <article className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-bg-surface-hover/50 sm:items-center sm:px-5"
      >
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
            tone === "ok" && "bg-status-approved/15 text-status-approved",
            tone === "danger" && "bg-status-rejected/15 text-status-rejected",
            tone === "warn" && "bg-status-pending/15 text-status-pending",
            tone === "default" && "bg-bg-surface-hover text-text-secondary",
          )}
        >
          {tone === "danger" ? (
            <XCircle className="size-4" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{title}</p>
            {planName && <ToneBadge tone="default">{planName}</ToneBadge>}
            {event.status && (
              <ToneBadge tone={statusTone(event.status)}>
                {event.status}
              </ToneBadge>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption">
            <span>{formatDateTime(event.created_at)}</span>
            {method?.number && (
              <span className="inline-flex items-center gap-1">
                <CreditCard className="size-3" />
                {formatCardLabel(method)}
              </span>
            )}
            {periodEnd != null && (
              <span>Period ends {formatUnixDate(periodEnd)}</span>
            )}
          </div>
        </div>

        <div className="mt-0.5 flex shrink-0 items-center gap-2 sm:mt-0">
          {amountLabel && (
            <span className="text-sm font-semibold tabular-nums text-text-primary">
              {amountLabel}
            </span>
          )}
          <span className="text-text-secondary">
            {open ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border-subtle bg-bg-base/40 px-4 py-4 sm:px-5">
          {method && <PaymentMethodCard method={method} />}

          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-caption">Amount</dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums text-text-primary">
                {amountLabel ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-caption">Plan</dt>
              <dd className="mt-0.5 text-sm text-text-primary">
                {planName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-caption">Subscription status</dt>
              <dd className="mt-0.5 text-sm capitalize text-text-primary">
                {event.status ?? event.entity?.status ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-caption">Current period ends</dt>
              <dd className="mt-0.5 text-sm text-text-primary">
                {formatUnixDate(periodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-caption">Processed</dt>
              <dd className="mt-0.5 text-sm text-text-primary">
                {formatDateTime(event.processed_at)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-caption">Subscription ID</dt>
              <dd className="mt-0.5 break-all font-mono text-xs text-text-secondary">
                {subscriptionId ?? "—"}
              </dd>
            </div>
          </dl>

          {event.raw_payload && (
            <div>
              <p className="mb-2 text-caption">Technical details</p>
              <pre className="max-h-48 overflow-auto rounded-lg border border-border-subtle bg-bg-base p-3 text-[11px] leading-relaxed text-text-secondary">
                {JSON.stringify(event.raw_payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function BillingTransactionsPage() {
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [processed, setProcessed] = useState<ProcessedFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const query = useMemo(
    () => ({
      eventTypes: eventTypes.length > 0 ? eventTypes : undefined,
      processed:
        processed === "all" ? null : processed === "true" ? true : false,
      dateFrom: fromDateInputValue(dateFrom),
      dateTo: fromDateInputValue(dateTo, true),
      page,
      pageSize,
    }),
    [eventTypes, processed, dateFrom, dateTo, page, pageSize],
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useBillingTransactions(query);

  const items = data?.items ?? [];
  const totalPages = Math.max(1, data?.total_pages ?? 1);
  const totalItems = data?.total_items ?? 0;

  const toggleEventType = (value: string) => {
    setPage(1);
    setEventTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const clearFilters = () => {
    setEventTypes([]);
    setProcessed("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters =
    eventTypes.length > 0 ||
    processed !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <AppShell>
      <PageHeader
        title="Billing history"
        description="Charges, renewals, and subscription changes on your account"
        action={
          <Link
            href="/settings/billing"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5",
            )}
          >
            <ArrowLeft className="size-3.5" />
            Back to billing
          </Link>
        }
      />

      <div className="mb-6 rounded-xl border border-border-subtle bg-bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
          <Filter className="size-4 text-accent" />
          Filters
        </div>

        <div className="flex flex-wrap gap-2">
          {EVENT_FILTERS.map((filter) => {
            const active = eventTypes.includes(filter.value);
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => toggleEventType(filter.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="processed-filter">Status</Label>
            <select
              id="processed-filter"
              value={processed}
              onChange={(event) => {
                setProcessed(event.target.value as ProcessedFilter);
                setPage(1);
              }}
              className="flex h-9 w-full rounded-lg border border-border-subtle bg-bg-base px-3 text-sm text-text-primary outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
            >
              <option value="all">All</option>
              <option value="true">Processed</option>
              <option value="false">Pending</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-from">From</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to">To</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption">
            {isLoading
              ? "Loading…"
              : `${totalItems} event${totalItems === 1 ? "" : "s"}`}
          </p>
          <div className="flex gap-2">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("size-3.5", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-status-rejected/30 bg-status-rejected/5 px-5 py-10 text-center">
          <XCircle className="mx-auto size-6 text-status-rejected" />
          <p className="mt-3 text-sm text-text-secondary">
            Couldn&apos;t load billing history.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-subtle bg-bg-surface/50 px-5 py-14 text-center">
          <Receipt className="mx-auto size-8 text-text-secondary" />
          <p className="mt-3 text-sm font-medium text-text-primary">
            No billing events yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-caption">
            Charges, activations, and cancellations will appear here after
            payments are processed.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "space-y-3 transition-opacity",
            isFetching && "opacity-70",
          )}
        >
          {items.map((event) => (
            <TransactionRow key={event.id} event={event} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-caption">
            Page {data?.current_page ?? page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
