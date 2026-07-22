"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PORTAL_ROOT = "/ops-e246f9e101aae83bee9e9600-portal";

export function AdminPage({
  title,
  description,
  actions,
  backHref,
  backLabel,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="space-y-4">
        {backHref ? (
          <Link
            href={backHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 gap-1.5 text-text-secondary",
            )}
          >
            <ArrowLeft className="size-4" />
            {backLabel ?? "Back"}
          </Link>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-base text-text-secondary">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      <div className="space-y-8">{children}</div>
    </main>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border-subtle bg-bg-surface",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}

export function DefinitionList({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 1 | 2 | 3;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-8 gap-y-5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-1.5">
          <dt className="text-sm font-medium text-text-secondary">
            {item.label}
          </dt>
          <dd className="text-base leading-relaxed wrap-break-word text-text-primary">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border-subtle bg-bg-base/40 px-4 py-8 text-center text-base text-text-secondary">
      {children}
    </p>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-2xl border border-border-subtle bg-bg-surface">
      <Loader2 className="size-7 animate-spin text-accent" />
    </div>
  );
}

export function ErrorState({
  retry,
  message = "Couldn’t load this admin data.",
}: {
  retry: () => void;
  message?: string;
}) {
  return (
    <div className="rounded-2xl border border-status-rejected/30 bg-status-rejected/5 px-6 py-10 text-center">
      <p className="text-base text-text-secondary">{message}</p>
      <Button className="mt-5" variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-160 text-left text-base">
        {children}
      </table>
    </div>
  );
}

export function Pagination({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  const start = total ? offset + 1 : 0;
  const end = Math.min(offset + limit, total);
  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <span className="text-sm text-text-secondary">
        {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={offset + limit >= total}
          onClick={() => onChange(offset + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    normalized === "active" ||
    normalized === "resolved" ||
    normalized === "published" ||
    normalized === "approved"
      ? "bg-status-approved/15 text-status-approved"
      : normalized === "failed" ||
          normalized === "spam" ||
          normalized === "cancelled" ||
          normalized === "expired" ||
          normalized === "rejected" ||
          normalized === "locked_over_limit"
        ? "bg-status-rejected/15 text-status-rejected"
        : "bg-status-pending/15 text-status-pending";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium",
        tone,
      )}
    >
      {humanize(value)}
    </span>
  );
}

export function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat().format(value ?? 0);
}

export const thClass =
  "border-b border-border-subtle bg-bg-base/50 px-5 py-3.5 text-sm font-semibold text-text-secondary sm:px-6";
export const tdClass =
  "border-b border-border-subtle px-5 py-4 align-top text-base text-text-primary sm:px-6";
