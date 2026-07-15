"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatMetricCount(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface MetricCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
  tone?: "default" | "accent" | "ok" | "warn" | "danger";
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
  tone = "default",
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-[0_1px_0_rgba(255,255,255,0.02)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl",
              tone === "accent" && "bg-accent/15 text-accent",
              tone === "ok" && "bg-status-approved/15 text-status-approved",
              tone === "warn" && "bg-status-pending/15 text-status-pending",
              tone === "danger" && "bg-status-rejected/15 text-status-rejected",
              tone === "default" && "bg-bg-surface-hover text-text-secondary",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-3 text-2xl font-semibold tabular-nums tracking-tight text-text-primary",
          tone === "warn" && "text-status-pending",
          tone === "danger" && "text-status-rejected",
          tone === "ok" && "text-status-approved",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-caption">{hint}</p>}
    </div>
  );
}
