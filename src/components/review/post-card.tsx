"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";
import type { GeneratedPost } from "@/lib/types";
import { getStatusColor } from "@/lib/post-status";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReviewerScoreGauge } from "@/components/shared/reviewer-score-gauge";
import { ReviewerNotes } from "@/components/shared/reviewer-notes";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: GeneratedPost;
  workspaceId: string;
  className?: string;
}

export function PostCard({ post, workspaceId, className }: PostCardProps) {
  const borderColor = getStatusColor(post.status);

  return (
    <Link
      href={`/workspaces/${workspaceId}/posts/${post.id}`}
      className={cn("block", className)}
    >
      <article
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface",
          "transition-[box-shadow,transform,border-color] duration-200",
          "hover:border-border-subtle/80 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
          "active:scale-[0.995]",
        )}
        style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
      >
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-stretch sm:gap-6 sm:p-6">
          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {post.content_type && (
                  <span className="rounded-full bg-bg-surface-hover px-2.5 py-0.5 text-caption text-text-secondary">
                    {post.content_type}
                  </span>
                )}
                <StatusBadge status={post.status} />
              </div>
              <div className="flex items-center gap-3">
                <ReviewerScoreGauge score={post.reviewer_score} size={40} />
                <span className="hidden text-caption sm:inline">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            <p className="mt-4 line-clamp-3 text-body leading-relaxed text-text-primary sm:line-clamp-4">
              {post.caption ?? "No caption"}
            </p>

            {post.reviewer_notes && (
              <ReviewerNotes notes={post.reviewer_notes} variant="card" />
            )}

            {post.hashtags && post.hashtags.length > 0 && (
              <p className="mt-3 line-clamp-2 text-caption text-text-secondary">
                {post.hashtags.map((h) => `#${h}`).join(" ")}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="flex flex-col gap-0.5 sm:hidden">
                <span className="text-caption">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {post.scheduled_for && (
                  <span className="text-caption text-status-approved">
                    Scheduled {new Date(post.scheduled_for).toLocaleDateString()}
                  </span>
                )}
              </div>
              {post.scheduled_for && (
                <span className="hidden text-caption text-status-approved sm:inline">
                  Scheduled {new Date(post.scheduled_for).toLocaleString()}
                </span>
              )}
              <span className="ml-auto flex items-center gap-1 text-caption text-text-secondary transition-colors duration-150 group-hover:text-accent">
                Review
                <ChevronRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>

          {/* Image — Instagram 1:1 */}
          {post.image_url && (
            <div className="shrink-0 sm:w-[148px] md:w-[168px] lg:w-[180px]">
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border-subtle bg-bg-base shadow-inner">
                <Image
                  src={post.image_url}
                  alt="Post preview"
                  fill
                  sizes="(max-width: 640px) 100vw, 180px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  unoptimized
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

/** Consistent vertical rhythm for post lists */
export function PostCardList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:gap-5", className)}>
      {children}
    </div>
  );
}
