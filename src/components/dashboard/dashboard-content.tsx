"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Camera,
  FileText,
  Brain,
  Inbox,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { isAtWorkspaceLimit } from "@/lib/plans";
import { resolveActiveWorkspaceId } from "@/lib/workspace-routing";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PostCard, PostCardList } from "@/components/review/post-card";
import { WorkspaceLimitBanner } from "@/components/billing/workspace-limit-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";

export function DashboardContent() {
  const searchParams = useSearchParams();
  const workspaceParam = searchParams.get("workspace");

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

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["posts", selectedWorkspace?.id],
    queryFn: () => api.posts.list(selectedWorkspace!.id),
    enabled: Boolean(selectedWorkspace),
  });

  const posts = postsData?.posts ?? [];
  const recentPosts = [...posts]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 8);
  const pendingCount = posts.filter(
    (p) => p.status === "PENDING_REVIEW",
  ).length;

  if (workspacesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Your AI social media command center"
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

  const wsId = selectedWorkspace!.id;
  const atLimit = isAtWorkspaceLimit(workspaces.length);

  return (
    <>
      <PageHeader
        title={selectedWorkspace?.name ?? "Dashboard"}
        description="Overview of content generation and review activity"
        action={
          pendingCount > 0 ? (
            <Link
              href={`/workspaces/${wsId}/review`}
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-surface-hover px-3 py-1.5 text-sm text-text-primary transition-colors duration-150 hover:bg-bg-surface"
            >
              <StatusBadge status="PENDING_REVIEW" />
              <span>{pendingCount} awaiting review</span>
            </Link>
          ) : undefined
        }
      />

      {atLimit && (
        <div className="mb-6">
          <WorkspaceLimitBanner workspaceCount={workspaces.length} />
        </div>
      )}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Pending review",
            value: pendingCount,
            href: `/workspaces/${wsId}/review`,
            icon: Inbox,
          },
          {
            label: "Instagram",
            value: "Manage",
            href: `/workspaces/${wsId}/settings/instagram`,
            icon: Camera,
          },
          {
            label: "Business profile",
            value: "Edit",
            href: `/workspaces/${wsId}/settings/business-profile`,
            icon: FileText,
          },
          {
            label: "AI configuration",
            value: "Edit",
            href: `/workspaces/${wsId}/settings/ai-configuration`,
            icon: Brain,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-lg border border-border-subtle bg-bg-surface p-4 transition-colors duration-150 hover:bg-bg-surface-hover"
            >
              <div className="flex items-center gap-2 text-caption">
                <Icon className="size-4" />
                {stat.label}
              </div>
              <p className="mt-2 text-section-header tabular-nums">
                {stat.value}
              </p>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-section-header">Recent posts</h2>
        {postsLoading ? (
          <div className="flex flex-col gap-4 md:gap-5">
            <Skeleton className="h-36 rounded-lg md:h-40" />
            <Skeleton className="h-36 rounded-lg md:h-40" />
          </div>
        ) : recentPosts.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No posts generated"
            description="AI-generated posts will appear here once your workspace starts producing content."
          />
        ) : (
          <PostCardList>
            {recentPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                workspaceId={wsId}
              />
            ))}
          </PostCardList>
        )}
      </div>
    </>
  );
}
