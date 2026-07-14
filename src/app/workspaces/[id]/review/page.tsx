"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { api } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { PostCard, PostCardList } from "@/components/review/post-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewInboxPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts", workspaceId],
    queryFn: () => api.posts.list(workspaceId),
  });

  const posts = data?.posts ?? [];
  const pendingPosts = posts.filter((p) => p.status === "PENDING_REVIEW");
  const decidedPosts = posts.filter(
    (p) =>
      p.status === "APPROVED" ||
      p.status === "REJECTED" ||
      p.status === "SKIPPED" ||
      p.status === "PUBLISHED",
  );

  return (
    <AppShell workspaceId={workspaceId}>
      <PageHeader
        title="Review Inbox"
        description="Approve, edit, or reject AI-generated posts before they publish"
      />

      {isLoading && (
        <div className="flex flex-col gap-4 md:gap-5">
          <Skeleton className="h-36 rounded-lg md:h-40" />
          <Skeleton className="h-36 rounded-lg md:h-40" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-status-rejected">Failed to load posts</p>
      )}

      {!isLoading && !isError && (
        <Tabs defaultValue="pending">
          <TabsList className="bg-bg-surface-hover">
            <TabsTrigger value="pending">
              Pending ({pendingPosts.length})
            </TabsTrigger>
            <TabsTrigger value="decided">
              Decided ({decidedPosts.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-6">
            {pendingPosts.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Inbox clear"
                description="No posts are waiting for your review. New content will appear here when generated."
              />
            ) : (
              <PostCardList>
                {pendingPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    workspaceId={workspaceId}
                  />
                ))}
              </PostCardList>
            )}
          </TabsContent>
          <TabsContent value="decided" className="mt-6">
            {decidedPosts.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No decided posts"
                description="Approved, rejected, and scheduled posts will appear here."
              />
            ) : (
              <PostCardList>
                {decidedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    workspaceId={workspaceId}
                  />
                ))}
              </PostCardList>
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}
