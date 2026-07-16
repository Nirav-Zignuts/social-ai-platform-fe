"use client";

import type { AnalyticsOverview } from "@/lib/types";
import { formatMetricCount } from "@/components/shared/metric-card";
import { formatPercent } from "@/lib/analytics-format";
import { TrendIndicator } from "@/components/dashboard/trend-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardKpiCardsProps {
  data?: AnalyticsOverview;
  isLoading: boolean;
  isFetching?: boolean;
}

function KpiCard({
  label,
  value,
  trend,
  hint,
}: {
  label: string;
  value: string;
  trend?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-[0_1px_0_rgba(255,255,255,0.02)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <p className="text-display tabular-nums">{value}</p>
        {trend}
      </div>
      {hint && <p className="mt-1 text-caption">{hint}</p>}
    </div>
  );
}

export function DashboardKpiCards({
  data,
  isLoading,
  isFetching,
}: DashboardKpiCardsProps) {
  if (isLoading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const profile = data?.profile;
  const engagement = data?.engagement;

  return (
    <div
      className={cn(
        "grid gap-4 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-4",
        isFetching && "opacity-70",
      )}
    >
      <KpiCard
        label="Followers"
        value={formatMetricCount(profile?.followers)}
        trend={<TrendIndicator changePct={profile?.followers_change_pct} />}
      />
      <KpiCard
        label="Posts published"
        value={formatMetricCount(data?.posts_published_in_period ?? 0)}
      />
      <KpiCard
        label="Avg engagement rate"
        value={formatPercent(engagement?.avg_engagement_rate)}
      />
      <KpiCard
        label="Total reach"
        value={formatMetricCount(engagement?.total_reach)}
      />
    </div>
  );
}
