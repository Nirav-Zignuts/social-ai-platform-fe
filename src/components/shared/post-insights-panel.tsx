"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Bookmark,
  Eye,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import type { PostInsights } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

const INSIGHT_ITEMS: {
  key: keyof PostInsights;
  label: string;
  icon: typeof Heart;
}[] = [
  { key: "like_count", label: "Likes", icon: Heart },
  { key: "comments_count", label: "Comments", icon: MessageCircle },
  { key: "saved_count", label: "Saves", icon: Bookmark },
  { key: "shares_count", label: "Shares", icon: Share2 },
  { key: "reach", label: "Reach", icon: Users },
  { key: "views", label: "Views", icon: Eye },
  { key: "total_interactions", label: "Interactions", icon: TrendingUp },
  { key: "profile_visits", label: "Profile visits", icon: UserRound },
];

export function PostInsightsPanel({
  insights,
  className,
}: {
  insights: PostInsights | null | undefined;
  className?: string;
}) {
  if (!insights) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border-subtle bg-bg-base/40 px-5 py-6",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-surface-hover text-text-secondary">
            <TrendingUp className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              Instagram insights
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Performance metrics appear here after this post is published to
              Instagram.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border-subtle bg-bg-surface",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
        <div>
          <h3 className="text-sm font-medium text-text-primary">
            Instagram insights
          </h3>
          {insights.fetched_at && (
            <p className="mt-0.5 text-caption">
              Updated{" "}
              {formatDistanceToNow(new Date(insights.fetched_at), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
        {insights.permalink && (
          <a
            href={insights.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-hover"
          >
            View on Instagram
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px bg-border-subtle sm:grid-cols-4">
        {INSIGHT_ITEMS.map(({ key, label, icon: Icon }) => {
          const raw = insights[key];
          const value = typeof raw === "number" ? raw : null;
          return (
            <div key={key} className="bg-bg-surface px-4 py-4">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Icon className="size-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-text-primary">
                {formatCount(value)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function formatMetricCount(value: number | null | undefined): string {
  return formatCount(value);
}

export function InstagramProfileAvatar({
  src,
  name,
  className,
}: {
  src: string | null | undefined;
  name: string;
  className?: string;
}) {
  const label = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return (
      <div
        className={cn(
          "relative size-14 shrink-0 overflow-hidden rounded-2xl",
          className,
        )}
      >
        <Image
          src={src}
          alt={name}
          fill
          sizes="56px"
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white",
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, #f58529 0%, #dd2a7b 45%, #8134af 75%, #515bd4 100%)",
      }}
    >
      {label || "IG"}
    </div>
  );
}
