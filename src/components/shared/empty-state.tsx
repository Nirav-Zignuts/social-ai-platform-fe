import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-bg-surface px-8 py-16 text-center",
        className,
      )}
    >
      <div className="mb-5 flex size-12 items-center justify-center rounded-lg border border-border-subtle bg-bg-base">
        <Icon className="size-5 text-text-secondary" strokeWidth={1.5} />
      </div>
      <h3 className="text-section-header">{title}</h3>
      <p className="mt-2 max-w-sm text-caption">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
