import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ReviewerScoreBadge({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  if (score === null) return null;

  const variant =
    score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive";
  const colorClass =
    score >= 80
      ? "bg-green-600 hover:bg-green-600"
      : score >= 60
        ? "bg-amber-500 hover:bg-amber-500 text-black"
        : "";

  return (
    <Badge variant={variant} className={cn(colorClass, className)}>
      Score: {score}
    </Badge>
  );
}
