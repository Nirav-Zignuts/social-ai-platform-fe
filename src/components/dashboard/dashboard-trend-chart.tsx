"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsTrend, AnalyticsTrendMetric } from "@/lib/types";
import { formatAnalyticsDate } from "@/lib/analytics-format";
import { DashboardSectionError } from "@/components/dashboard/dashboard-section-error";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const METRIC_TABS: { value: AnalyticsTrendMetric; label: string }[] = [
  { value: "followers", label: "Followers" },
  { value: "reach", label: "Reach" },
  { value: "engagement_rate", label: "Engagement rate" },
];

interface DashboardTrendChartProps {
  metric: AnalyticsTrendMetric;
  onMetricChange: (metric: AnalyticsTrendMetric) => void;
  data?: AnalyticsTrend;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  onRetry: () => void;
}

function formatTooltipValue(metric: AnalyticsTrendMetric, value: number) {
  if (metric === "engagement_rate") return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

function formatAxisValue(metric: AnalyticsTrendMetric, value: number) {
  if (metric === "engagement_rate") return `${value}%`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function PlaceholderChart() {
  const points = [
    { x: 0, y: 30 },
    { x: 25, y: 45 },
    { x: 50, y: 38 },
    { x: 75, y: 55 },
    { x: 100, y: 48 },
  ];
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${100 - p.y}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full opacity-[0.12]"
      aria-hidden
    >
      <path d={`${path} L 100 100 L 0 100 Z`} fill="var(--accent)" />
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function DashboardTrendChart({
  metric,
  onMetricChange,
  data,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: DashboardTrendChartProps) {
  const chartData = useMemo(
    () =>
      (data?.data_points ?? []).map((point) => ({
        ...point,
        label: formatAnalyticsDate(point.date),
      })),
    [data?.data_points],
  );

  const hasData = chartData.length > 0;
  const singlePoint = chartData.length === 1;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-surface p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-section-header">Trend</h2>
          <p className="mt-0.5 text-caption">
            Track growth and engagement over time
          </p>
        </div>
        <Tabs
          value={metric}
          onValueChange={(value) =>
            onMetricChange(value as AnalyticsTrendMetric)
          }
        >
          <TabsList className="h-8">
            {METRIC_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading && !data ? (
        <Skeleton className="min-h-[280px] flex-1 rounded-lg" />
      ) : isError ? (
        <DashboardSectionError onRetry={onRetry} className="min-h-[280px]" />
      ) : (
        <div
          className={cn(
            "relative min-h-[280px] flex-1 transition-opacity duration-200",
            isFetching && "opacity-70",
          )}
        >
          {!hasData ? (
            <div className="relative flex h-full min-h-[280px] items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-bg-base/40">
              <PlaceholderChart />
              <p className="relative z-10 max-w-xs px-6 text-center text-sm text-text-secondary">
                Trend data builds up over time — check back in a few days
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  domain={singlePoint ? [0, "auto"] : ["auto", "auto"]}
                  allowDecimals={metric === "engagement_rate"}
                  tickFormatter={(value) => formatAxisValue(metric, value)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "var(--text-secondary)" }}
                  formatter={(value) =>
                    formatTooltipValue(metric, Number(value))
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6C5CE7"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                  dot={
                    singlePoint
                      ? { r: 5, fill: "#6C5CE7", strokeWidth: 0 }
                      : false
                  }
                  activeDot={{ r: 4, fill: "#6C5CE7" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
