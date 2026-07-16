"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  changePct: number | null | undefined;
  className?: string;
}

export function TrendIndicator({
  changePct,
  className,
}: TrendIndicatorProps) {
  if (changePct == null) {
    return null;
  }

  if (changePct === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-caption text-text-secondary",
          className,
        )}
      >
        <Minus className="size-3" />
        0%
      </span>
    );
  }

  const positive = changePct > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-caption font-medium tabular-nums",
        positive ? "text-status-approved" : "text-status-rejected",
        className,
      )}
    >
      {positive ? (
        <TrendingUp className="size-3.5" />
      ) : (
        <TrendingDown className="size-3.5" />
      )}
      {Math.abs(changePct).toFixed(1)}%
    </span>
  );
}
