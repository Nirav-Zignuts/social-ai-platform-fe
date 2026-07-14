import { getStatusColor, getStatusLabel } from "@/lib/post-status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-bg-surface-hover px-2 py-0.5 text-caption text-text-primary",
        className,
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
