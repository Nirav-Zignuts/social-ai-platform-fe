"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewActions } from "@/components/review/review-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string; postId: string }>;
}

export default function PostDetailPage({ params }: PageProps) {
  const { id: workspaceId, postId } = use(params);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["post", workspaceId, postId],
    queryFn: () => api.posts.get(workspaceId, postId),
  });

  return (
    <AppShell workspaceId={workspaceId}>
      <div className="mb-4">
        <Link
          href={`/workspaces/${workspaceId}/review`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to inbox
        </Link>
      </div>

      <PageHeader
        title="Post review"
        description="Review content quality and approve for publishing"
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
          <p className="text-status-rejected">Failed to load post</p>
          <Button className="mt-4" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {data?.post && (
        <ReviewActions
          post={data.post}
          workspaceId={workspaceId}
          insights={data.insights}
        />
      )}
    </AppShell>
  );
}
