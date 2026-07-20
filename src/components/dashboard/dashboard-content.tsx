"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { getOnboardingResumePath } from "@/lib/onboarding";
import { isAtWorkspaceLimit } from "@/lib/plans";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import {
  resolveActiveWorkspaceId,
  workspaceNeedsOnboarding,
} from "@/lib/workspace-routing";
import type {
  AnalyticsPeriod,
  AnalyticsPostsSortBy,
  AnalyticsSortOrder,
  AnalyticsTrendMetric,
} from "@/lib/types";
import {
  useAnalyticsContentTypeBreakdown,
  useAnalyticsOverview,
  useAnalyticsPosts,
  useAnalyticsTrend,
} from "@/hooks/useAnalytics";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkspaceLimitBanner } from "@/components/billing/workspace-limit-banner";
import { AnalyticsPeriodSelector } from "@/components/dashboard/analytics-period-selector";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { DashboardTrendChart } from "@/components/dashboard/dashboard-trend-chart";
import { DashboardBestPostCard } from "@/components/dashboard/dashboard-best-post-card";
import { DashboardContentTypeChart } from "@/components/dashboard/dashboard-content-type-chart";
import { DashboardNeedsAttention } from "@/components/dashboard/dashboard-needs-attention";
import {
  DASHBOARD_POSTS_PAGE_SIZE,
  DashboardPostTable,
} from "@/components/dashboard/dashboard-post-table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceParam = searchParams.get("workspace");

  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [trendMetric, setTrendMetric] =
    useState<AnalyticsTrendMetric>("followers");
  const [sortBy, setSortBy] = useState<AnalyticsPostsSortBy>("engagement_rate");
  const [sortOrder, setSortOrder] = useState<AnalyticsSortOrder>("desc");
  const [postsOffset, setPostsOffset] = useState(0);

  const { data: workspacesData, isLoading: workspacesLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const workspaces = workspacesData?.workspaces ?? [];
  const activeId = resolveActiveWorkspaceId({
    pathname: "/dashboard",
    queryWorkspaceId: workspaceParam,
    workspaceIds: workspaces.map((w) => w.id),
  });
  const selectedWorkspace =
    workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  useEffect(() => {
    if (!selectedWorkspace || !workspaceNeedsOnboarding(selectedWorkspace)) {
      return;
    }
    router.replace(getOnboardingResumePath(selectedWorkspace.id));
  }, [selectedWorkspace, router]);

  const workspaceId = selectedWorkspace?.id;
  const onboardingComplete =
    Boolean(workspaceId) && !workspaceNeedsOnboarding(selectedWorkspace);

  const overviewQuery = useAnalyticsOverview(
    onboardingComplete ? workspaceId : undefined,
    period,
  );
  const trendQuery = useAnalyticsTrend(
    onboardingComplete ? workspaceId : undefined,
    trendMetric,
    period,
  );
  const breakdownQuery = useAnalyticsContentTypeBreakdown(
    onboardingComplete ? workspaceId : undefined,
    period,
  );
  const postsQuery = useAnalyticsPosts(
    onboardingComplete ? workspaceId : undefined,
    {
      sortBy,
      order: sortOrder,
      limit: DASHBOARD_POSTS_PAGE_SIZE,
      offset: postsOffset,
    },
  );

  const { data: pendingPostsData, isLoading: pendingPostsLoading } = useQuery({
    queryKey: ["posts", workspaceId, "pending_review"],
    queryFn: () => api.posts.list(workspaceId!, "PENDING_REVIEW"),
    enabled: onboardingComplete,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: billingStatus } = useBillingStatus();

  const pendingPosts = pendingPostsData?.posts ?? [];
  const periodFetching =
    overviewQuery.isFetching ||
    trendQuery.isFetching ||
    breakdownQuery.isFetching;
  const atLimit = isAtWorkspaceLimit(
    workspaces.length,
    billingStatus?.workspace_limit ?? 2,
  );

  const handlePeriodChange = (next: AnalyticsPeriod) => {
    setPeriod(next);
    setPostsOffset(0);
  };

  const handleSortChange = (column: AnalyticsPostsSortBy) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(column);
      setSortOrder(column === "published_at" ? "desc" : "desc");
    }
    setPostsOffset(0);
  };

  if (workspacesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Performance insights for your social content"
        />
        <EmptyState
          icon={Building2}
          title="No workspaces yet"
          description="Create a workspace to start generating and reviewing AI-powered social content."
          actionLabel="Create workspace"
          onAction={() => {
            window.location.href = "/onboarding";
          }}
        />
      </>
    );
  }

  if (workspaceNeedsOnboarding(selectedWorkspace)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <p className="text-sm text-text-secondary">
          Finishing workspace setup…
        </p>
      </div>
    );
  }

  const wsId = selectedWorkspace!.id;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Track followers, engagement, and what content performs best"
        action={
          <AnalyticsPeriodSelector
            value={period}
            onChange={handlePeriodChange}
            disabled={periodFetching && !overviewQuery.data}
          />
        }
      />

      {atLimit && <WorkspaceLimitBanner workspaceCount={workspaces.length} />}

      <div
        className={cn(
          "space-y-8",
          periodFetching && overviewQuery.data && "relative",
        )}
      >
        {periodFetching && overviewQuery.data && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
            <span className="rounded-full border border-border-subtle bg-bg-surface px-3 py-1 text-caption shadow-sm">
              Updating…
            </span>
          </div>
        )}

        <DashboardKpiCards
          data={overviewQuery.data}
          isLoading={overviewQuery.isLoading}
          isFetching={overviewQuery.isFetching}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <DashboardTrendChart
              metric={trendMetric}
              onMetricChange={setTrendMetric}
              data={trendQuery.data}
              isLoading={trendQuery.isLoading}
              isFetching={trendQuery.isFetching}
              isError={trendQuery.isError}
              onRetry={() => trendQuery.refetch()}
            />
          </div>
          <div className="lg:col-span-2">
            <DashboardBestPostCard
              post={overviewQuery.data?.best_performing_post}
              workspaceId={wsId}
              pendingCount={pendingPosts.length}
              isLoading={overviewQuery.isLoading}
              isFetching={overviewQuery.isFetching}
            />
          </div>
        </div>

        <DashboardContentTypeChart
          data={breakdownQuery.data}
          isLoading={breakdownQuery.isLoading}
          isFetching={breakdownQuery.isFetching}
          isError={breakdownQuery.isError}
          onRetry={() => breakdownQuery.refetch()}
        />

        <DashboardNeedsAttention
          posts={pendingPosts}
          workspaceId={wsId}
          isLoading={pendingPostsLoading}
        />

        <DashboardPostTable
          posts={postsQuery.data?.posts ?? []}
          total={postsQuery.data?.total ?? 0}
          sortBy={sortBy}
          order={sortOrder}
          offset={postsOffset}
          workspaceId={wsId}
          isLoading={postsQuery.isLoading}
          isFetching={postsQuery.isFetching}
          isError={postsQuery.isError}
          onSortChange={handleSortChange}
          onPageChange={setPostsOffset}
          onRetry={() => postsQuery.refetch()}
        />
      </div>
    </div>
  );
}
