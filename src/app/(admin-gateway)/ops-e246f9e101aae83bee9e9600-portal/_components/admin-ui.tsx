"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PORTAL_ROOT =
  "/ops-e246f9e101aae83bee9e9600-portal";

export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-page-title">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </main>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl border border-border-subtle bg-bg-surface">
      <Loader2 className="size-6 animate-spin text-accent" />
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
    <div className="rounded-xl border border-status-rejected/30 bg-status-rejected/5 p-6 text-center">
      <p className="text-sm text-text-secondary">{message}</p>
      <Button className="mt-4" variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-surface">
      <table className="w-full min-w-180 text-left text-sm">{children}</table>
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-text-secondary">
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
  const tone =
    value === "active" || value === "resolved" || value === "published"
      ? "bg-status-approved/10 text-status-approved"
      : value === "failed" ||
          value === "spam" ||
          value === "cancelled" ||
          value === "expired"
        ? "bg-status-rejected/10 text-status-rejected"
        : "bg-status-pending/10 text-status-pending";
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${tone}`}>
      {humanize(value)}
    </span>
  );
}

export function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat().format(value ?? 0);
}

export const thClass =
  "border-b border-border-subtle bg-bg-surface-hover/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary";
export const tdClass = "border-b border-border-subtle px-4 py-3 align-top";
