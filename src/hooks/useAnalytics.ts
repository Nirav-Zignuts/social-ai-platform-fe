"use client";

import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  AnalyticsOverview,
  AnalyticsPeriod,
  AnalyticsPostsResult,
  AnalyticsPostsSortBy,
  AnalyticsSortOrder,
  AnalyticsTrend,
  AnalyticsTrendMetric,
  ContentTypeBreakdown,
  QualityCorrelation,
} from "@/lib/types";

const ANALYTICS_STALE_TIME = 60_000;

export function useAnalyticsOverview(
  workspaceId: string | undefined,
  period: AnalyticsPeriod,
): UseQueryResult<AnalyticsOverview> {
  return useQuery({
    queryKey: ["analytics", "overview", workspaceId, period],
    queryFn: () => api.analytics.overview(workspaceId!, period),
    enabled: Boolean(workspaceId),
    staleTime: ANALYTICS_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useAnalyticsTrend(
  workspaceId: string | undefined,
  metric: AnalyticsTrendMetric,
  period: AnalyticsPeriod,
): UseQueryResult<AnalyticsTrend> {
  return useQuery({
    queryKey: ["analytics", "trend", workspaceId, metric, period],
    queryFn: () => api.analytics.trend(workspaceId!, metric, period),
    enabled: Boolean(workspaceId),
    staleTime: ANALYTICS_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useAnalyticsPosts(
  workspaceId: string | undefined,
  options: {
    sortBy: AnalyticsPostsSortBy;
    order: AnalyticsSortOrder;
    limit: number;
    offset: number;
    contentType?: string;
  },
): UseQueryResult<AnalyticsPostsResult> {
  return useQuery({
    queryKey: ["analytics", "posts", workspaceId, options],
    queryFn: () =>
      api.analytics.posts(workspaceId!, {
        sortBy: options.sortBy,
        order: options.order,
        limit: options.limit,
        offset: options.offset,
        contentType: options.contentType,
      }),
    enabled: Boolean(workspaceId),
    staleTime: ANALYTICS_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useAnalyticsContentTypeBreakdown(
  workspaceId: string | undefined,
  period: AnalyticsPeriod,
): UseQueryResult<ContentTypeBreakdown> {
  return useQuery({
    queryKey: ["analytics", "content-type-breakdown", workspaceId, period],
    queryFn: () => api.analytics.contentTypeBreakdown(workspaceId!, period),
    enabled: Boolean(workspaceId),
    staleTime: ANALYTICS_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useAnalyticsQualityCorrelation(
  workspaceId: string | undefined,
  period: AnalyticsPeriod,
): UseQueryResult<QualityCorrelation> {
  return useQuery({
    queryKey: ["analytics", "quality-correlation", workspaceId, period],
    queryFn: () => api.analytics.qualityCorrelation(workspaceId!, period),
    enabled: Boolean(workspaceId),
    staleTime: ANALYTICS_STALE_TIME,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
