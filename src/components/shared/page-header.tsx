import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 border-b border-border-subtle pb-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-page-title">{title}</h1>
          {description && (
            <p className="mt-1 text-caption">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
