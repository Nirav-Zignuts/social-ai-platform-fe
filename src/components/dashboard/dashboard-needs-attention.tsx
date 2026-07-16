"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GeneratedPost } from "@/lib/types";
import { PostCard, PostCardList } from "@/components/review/post-card";
import { Skeleton } from "@/components/ui/skeleton";

/** Full-width cards read well; more than this belongs in Review Inbox. */
const MAX_VISIBLE = 2;

interface DashboardNeedsAttentionProps {
  posts: GeneratedPost[];
  workspaceId: string;
  isLoading: boolean;
}

export function DashboardNeedsAttention({
  posts,
  workspaceId,
  isLoading,
}: DashboardNeedsAttentionProps) {
  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex flex-col gap-4 md:gap-5">
          <Skeleton className="h-40 rounded-lg md:h-44" />
          <Skeleton className="h-40 rounded-lg md:h-44" />
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  const visible = posts.slice(0, MAX_VISIBLE);
  const hiddenCount = posts.length - visible.length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-section-header">Needs your attention</h2>
          <p className="mt-0.5 text-caption">
            {posts.length === 1
              ? "1 post waiting for your review before it publishes"
              : `${posts.length} posts waiting for your review before they publish`}
          </p>
        </div>
        <Link
          href={`/workspaces/${workspaceId}/review`}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          {hiddenCount > 0
            ? `View all ${posts.length} in Review Inbox`
            : "Open Review Inbox"}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <PostCardList>
        {visible.map((post) => (
          <PostCard key={post.id} post={post} workspaceId={workspaceId} />
        ))}
      </PostCardList>

      {hiddenCount > 0 && (
        <p className="text-center text-caption">
          +{hiddenCount} more in{" "}
          <Link
            href={`/workspaces/${workspaceId}/review`}
            className="text-accent hover:text-accent-hover"
          >
            Review Inbox
          </Link>
        </p>
      )}
    </section>
  );
}
