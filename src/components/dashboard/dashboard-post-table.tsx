"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type {
  AnalyticsPostItem,
  AnalyticsPostsSortBy,
  AnalyticsSortOrder,
} from "@/lib/types";
import {
  formatAnalyticsDate,
  formatContentTypeLabel,
  formatPercent,
} from "@/lib/analytics-format";
import { formatMetricCount } from "@/components/shared/metric-card";
import { DashboardSectionError } from "@/components/dashboard/dashboard-section-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type SortableColumn = AnalyticsPostsSortBy;

interface DashboardPostTableProps {
  posts: AnalyticsPostItem[];
  total: number;
  sortBy: AnalyticsPostsSortBy;
  order: AnalyticsSortOrder;
  offset: number;
  workspaceId: string;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  onSortChange: (sortBy: SortableColumn) => void;
  onPageChange: (offset: number) => void;
  onRetry: () => void;
}

function SortIcon({
  column,
  sortBy,
  order,
}: {
  column: SortableColumn;
  sortBy: AnalyticsPostsSortBy;
  order: AnalyticsSortOrder;
}) {
  if (sortBy !== column) {
    return <ArrowUpDown className="size-3.5 opacity-40" />;
  }
  return order === "asc" ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  );
}

function Th({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary",
        onClick && "cursor-pointer select-none hover:text-text-primary",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </th>
  );
}

export function DashboardPostTable({
  posts,
  total,
  sortBy,
  order,
  offset,
  workspaceId,
  isLoading,
  isFetching,
  isError,
  onSortChange,
  onPageChange,
  onRetry,
}: DashboardPostTableProps) {
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  const handleSort = (column: SortableColumn) => {
    onSortChange(column);
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5">
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-bg-surface transition-opacity duration-200",
        isFetching && "opacity-70",
      )}
    >
      <div className="border-b border-border-subtle px-5 py-4">
        <h2 className="text-section-header">Post performance</h2>
        <p className="mt-0.5 text-caption">
          Published posts with synced Instagram insights
        </p>
      </div>

      {isError ? (
        <div className="p-5">
          <DashboardSectionError onRetry={onRetry} />
        </div>
      ) : posts.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-text-secondary">
          No published posts with analytics in this view yet
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="border-b border-border-subtle bg-bg-base/40">
                <tr>
                  <Th className="w-14">Post</Th>
                  <Th>Caption</Th>
                  <Th>Type</Th>
                  <Th
                    onClick={() => handleSort("published_at")}
                    className="whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      Published
                      <SortIcon
                        column="published_at"
                        sortBy={sortBy}
                        order={order}
                      />
                    </span>
                  </Th>
                  <Th
                    onClick={() => handleSort("reach")}
                    className="text-right"
                  >
                    <span className="inline-flex items-center gap-1">
                      Reach
                      <SortIcon column="reach" sortBy={sortBy} order={order} />
                    </span>
                  </Th>
                  <Th
                    onClick={() => handleSort("engagement_rate")}
                    className="text-right"
                  >
                    <span className="inline-flex items-center gap-1">
                      Engagement
                      <SortIcon
                        column="engagement_rate"
                        sortBy={sortBy}
                        order={order}
                      />
                    </span>
                  </Th>
                  <Th className="text-right">Likes</Th>
                  <Th className="text-right">Comments</Th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.post_id}
                    className="border-b border-border-subtle/70 transition-colors hover:bg-bg-surface-hover/40"
                  >
                    <td className="px-3 py-3">
                      <Link
                        href={`/workspaces/${workspaceId}/posts/${post.post_id}`}
                        className="block"
                      >
                        <div className="relative size-10 overflow-hidden rounded-md border border-border-subtle bg-bg-base">
                          {post.image_url ? (
                            <Image
                              src={post.image_url}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[10px] text-text-secondary">
                              —
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      <Link
                        href={`/workspaces/${workspaceId}/posts/${post.post_id}`}
                        className="line-clamp-2 text-text-primary hover:text-accent"
                      >
                        {post.caption_preview}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {post.content_type ? (
                        <span className="rounded-full bg-bg-surface-hover px-2 py-0.5 text-caption text-text-secondary">
                          {formatContentTypeLabel(post.content_type)}
                        </span>
                      ) : (
                        <span className="text-caption text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-caption text-text-secondary">
                      {post.published_at
                        ? formatAnalyticsDate(post.published_at)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatMetricCount(post.insights?.reach)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatPercent(post.insights?.engagement_rate)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatMetricCount(post.insights?.likes)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatMetricCount(post.insights?.comments)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border-subtle px-5 py-4">
            <p className="text-caption">
              Page {currentPage} of {totalPages} · {total} post
              {total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev || isFetching}
                onClick={() => onPageChange(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext || isFetching}
                onClick={() => onPageChange(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { PAGE_SIZE as DASHBOARD_POSTS_PAGE_SIZE };
