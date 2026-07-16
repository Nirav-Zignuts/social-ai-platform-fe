"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardSectionErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DashboardSectionError({
  message = "Couldn't load this section",
  onRetry,
  className,
}: DashboardSectionErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-border-subtle bg-bg-base/50 px-6 py-10 text-center",
        className,
      )}
    >
      <AlertCircle className="size-5 text-status-rejected" />
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
