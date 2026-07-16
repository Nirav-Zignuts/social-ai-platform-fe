"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ContentTypeBreakdown } from "@/lib/types";
import {
  formatContentTypeLabel,
  formatPercent,
} from "@/lib/analytics-format";
import { DashboardSectionError } from "@/components/dashboard/dashboard-section-error";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "#6C5CE7",
  "#4DB88A",
  "#E5A94D",
  "#7D6EF0",
  "#E5645A",
  "#6B6D75",
];

interface DashboardContentTypeChartProps {
  data?: ContentTypeBreakdown;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function DashboardContentTypeChart({
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: DashboardContentTypeChartProps) {
  const breakdown = data?.breakdown ?? [];
  const chartData = breakdown.map((item) => ({
    ...item,
    label: formatContentTypeLabel(item.content_type),
    rate: item.avg_engagement_rate ?? 0,
  }));

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-6 h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-bg-surface p-5 transition-opacity duration-200",
        isFetching && "opacity-70",
      )}
    >
      <div className="mb-4">
        <h2 className="text-section-header">Content type performance</h2>
        <p className="mt-0.5 text-caption">
          Average engagement rate by content style
        </p>
      </div>

      {isError ? (
        <DashboardSectionError onRetry={onRetry} className="min-h-[200px]" />
      ) : chartData.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-base/40 px-6 text-center text-sm text-text-secondary">
          No published posts in this period to compare content types
        </div>
      ) : (
        <div className="min-h-[200px]">
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, chartData.length * 48)}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="label"
                width={120}
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(108, 92, 231, 0.08)" }}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, _name, item) => {
                  const payload = item.payload as (typeof chartData)[number];
                  return [
                    formatPercent(Number(value)),
                    `based on ${payload.post_count} post${payload.post_count === 1 ? "" : "s"}`,
                  ];
                }}
              />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.content_type}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {chartData.map((item) => (
              <div
                key={item.content_type}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-text-primary">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums text-text-primary">
                    {formatPercent(item.avg_engagement_rate)}
                  </span>
                  <span className="text-caption">
                    based on {item.post_count} post
                    {item.post_count === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
