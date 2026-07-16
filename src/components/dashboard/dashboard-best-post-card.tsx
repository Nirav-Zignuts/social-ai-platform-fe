"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { BestPerformingPost } from "@/lib/types";
import { formatPercent } from "@/lib/analytics-format";
import { getStatusColor } from "@/lib/post-status";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardBestPostCardProps {
  post: BestPerformingPost | null | undefined;
  workspaceId: string;
  pendingCount: number;
  isLoading: boolean;
  isFetching?: boolean;
}

export function DashboardBestPostCard({
  post,
  workspaceId,
  pendingCount,
  isLoading,
  isFetching,
}: DashboardBestPostCardProps) {
  const borderColor = getStatusColor("PUBLISHED");

  if (isLoading) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-surface p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-6 h-40 flex-1 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border-subtle bg-bg-surface p-5 transition-opacity duration-200",
        isFetching && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-section-header">Best performing post</h2>
          <p className="mt-0.5 text-caption">Top engagement in this period</p>
        </div>
        {post && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-accent">
            <Trophy className="size-3" />
            Top performer
          </span>
        )}
      </div>

      {!post ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border-subtle bg-bg-base/40 px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">
            No published posts yet this period
          </p>
          {pendingCount > 0 ? (
            <Link
              href={`/workspaces/${workspaceId}/review`}
              className="mt-4 inline-flex h-8 items-center justify-center rounded-lg border border-border-subtle bg-transparent px-2.5 text-[0.8125rem] font-medium text-text-primary transition-colors hover:bg-bg-surface-hover"
            >
              Review {pendingCount} pending post
              {pendingCount === 1 ? "" : "s"}
            </Link>
          ) : (
            <p className="mt-3 max-w-xs text-caption">
              New AI-generated posts will appear in your review inbox when ready.
            </p>
          )}
        </div>
      ) : (
        <Link
          href={`/workspaces/${workspaceId}/posts/${post.post_id}`}
          className="group mt-5 block flex-1"
        >
          <article
            className="relative overflow-hidden rounded-lg border border-border-subtle bg-bg-base transition-[box-shadow,border-color] duration-200 hover:border-accent/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
            style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
          >
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              {post.image_url && (
                <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-md border border-border-subtle bg-bg-surface sm:w-28">
                  <Image
                    src={post.image_url}
                    alt="Top performing post"
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="line-clamp-3 text-sm leading-relaxed text-text-primary">
                  {post.caption_preview}
                </p>
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide text-text-secondary">
                    Engagement rate
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums text-status-approved">
                    {formatPercent(post.engagement_rate)}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </Link>
      )}
    </div>
  );
}
