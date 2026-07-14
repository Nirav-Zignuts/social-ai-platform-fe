import type { GeneratedPostStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  GeneratedPostStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  REVIEWER_PASSED: { label: "Reviewer Passed", variant: "outline" },
  REVIEWER_FAILED: { label: "Reviewer Failed", variant: "destructive" },
  PENDING_REVIEW: { label: "Pending Review", variant: "default" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  PUBLISHED: { label: "Published", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
  SKIPPED: { label: "Skipped", variant: "secondary" },
};

export function PostStatusBadge({
  status,
  className,
}: {
  status: GeneratedPostStatus | string;
  className?: string;
}) {
  const config =
    STATUS_CONFIG[status as GeneratedPostStatus] ?? {
      label: status,
      variant: "outline" as const,
    };

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
