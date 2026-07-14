"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { api } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { PostCard, PostCardList } from "@/components/review/post-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublishedPostsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts", workspaceId, "PUBLISHED"],
    queryFn: () => api.posts.list(workspaceId, "PUBLISHED"),
  });

  const posts = data?.posts ?? [];

  return (
    <AppShell workspaceId={workspaceId}>
      <PageHeader
        title="Published"
        description="Posts that have been published to Instagram"
      />

      {isLoading && (
        <div className="flex flex-col gap-4 md:gap-5">
          <Skeleton className="h-36 rounded-lg md:h-40" />
          <Skeleton className="h-36 rounded-lg md:h-40" />
          <Skeleton className="h-36 rounded-lg md:h-40" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-status-rejected">
          Failed to load published posts
        </p>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <EmptyState
          icon={Send}
          title="No published posts yet"
          description="Approved posts will show up here after they’re published to Instagram."
        />
      )}

      {!isLoading && !isError && posts.length > 0 && (
        <div className="space-y-4">
          <p className="text-caption">
            {posts.length} published {posts.length === 1 ? "post" : "posts"}
          </p>
          <PostCardList>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                workspaceId={workspaceId}
              />
            ))}
          </PostCardList>
        </div>
      )}
    </AppShell>
  );
}
