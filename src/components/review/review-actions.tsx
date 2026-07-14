"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import type { GeneratedPost, PostInsights } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReviewerScoreGauge } from "@/components/shared/reviewer-score-gauge";
import { ReviewerNotes } from "@/components/shared/reviewer-notes";
import { PostInsightsPanel } from "@/components/shared/post-insights-panel";
import { getStatusColor } from "@/lib/post-status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

interface ReviewActionsProps {
  post: GeneratedPost;
  workspaceId: string;
  insights?: PostInsights | null;
}

export function ReviewActions({
  post,
  workspaceId,
  insights,
}: ReviewActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [regenerateFeedback, setRegenerateFeedback] = useState("");
  const [editCaption, setEditCaption] = useState(post.caption ?? "");
  const [editHashtags, setEditHashtags] = useState(
    (post.hashtags ?? []).join(", "),
  );
  const [editCta, setEditCta] = useState(post.cta ?? "");
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["post", workspaceId, post.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["posts", workspaceId],
    });
  };

  const approveMutation = useMutation({
    mutationFn: () => api.posts.approve(workspaceId, post.id),
    onSuccess: (data) => {
      setScheduledFor(data.post.scheduled_for);
      invalidate();
      toast.success("Post approved");
      setApproveOpen(false);
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Approve failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.posts.reject(workspaceId, post.id, feedback),
    onSuccess: () => {
      invalidate();
      toast.success("Post rejected");
      setRejectOpen(false);
      router.push(`/workspaces/${workspaceId}/review`);
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Reject failed"),
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      api.posts.regenerate(workspaceId, post.id, regenerateFeedback),
    onSuccess: () => {
      invalidate();
      toast.success("Regeneration started — refreshing post...");
      setRegenerateOpen(false);
      setRegenerateFeedback("");
      const pollInterval = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: ["post", workspaceId, post.id],
        });
      }, 3000);
      setTimeout(() => clearInterval(pollInterval), 30000);
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Regenerate failed"),
  });

  const skipMutation = useMutation({
    mutationFn: () => api.posts.skip(workspaceId, post.id),
    onSuccess: () => {
      invalidate();
      toast.success("Post skipped");
      setSkipOpen(false);
      router.push(`/workspaces/${workspaceId}/review`);
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Skip failed"),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      api.posts.edit(workspaceId, post.id, {
        caption: editCaption,
        hashtags: editHashtags
          .split(",")
          .map((h) => h.trim().replace(/^#/, ""))
          .filter(Boolean),
        cta: editCta || undefined,
      }),
    onSuccess: (data) => {
      setScheduledFor(data.post.scheduled_for);
      invalidate();
      toast.success("Post saved and approved");
      setEditOpen(false);
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Edit failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.posts.delete(workspaceId, post.id),
    onSuccess: () => {
      invalidate();
      toast.success("Post deleted");
      setDeleteOpen(false);
      const returnPath =
        post.status === "PUBLISHED"
          ? `/workspaces/${workspaceId}/published`
          : `/workspaces/${workspaceId}/review`;
      router.push(returnPath);
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Delete failed"),
  });

  const isPending = post.status === "PENDING_REVIEW";
  const isRegenerating = regenerateMutation.isPending;

  return (
    <div
      className="space-y-6 rounded-lg border border-border-subtle bg-bg-surface p-5 sm:p-6 md:p-8"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(post.status),
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {post.content_type && (
            <span className="rounded-full bg-bg-surface-hover px-2 py-0.5 text-caption text-text-secondary">
              {post.content_type}
            </span>
          )}
          <StatusBadge status={post.status} />
        </div>
        <ReviewerScoreGauge score={post.reviewer_score} size={48} />
      </div>

      {post.image_url && (
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border-subtle bg-bg-base shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <Image
              src={post.image_url}
              alt="Post image"
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              unoptimized
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-section-header">Caption</h3>
        <p className="whitespace-pre-wrap text-body">{post.caption}</p>
      </div>

      {post.hashtags && post.hashtags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-section-header">Hashtags</h3>
          <p className="text-caption">
            {post.hashtags.map((h) => `#${h}`).join(" ")}
          </p>
        </div>
      )}

      {post.cta && (
        <div className="space-y-2">
          <h3 className="text-section-header">CTA</h3>
          <p className="text-body">{post.cta}</p>
        </div>
      )}

      {post.reviewer_notes && (
        <ReviewerNotes notes={post.reviewer_notes} variant="panel" />
      )}

      <PostInsightsPanel insights={insights} />

      {scheduledFor && (
        <p className="text-sm text-status-approved">
          Scheduled for: {new Date(scheduledFor).toLocaleString()}
        </p>
      )}

      {post.scheduled_for && !scheduledFor && (
        <p className="text-caption">
          Scheduled for: {new Date(post.scheduled_for).toLocaleString()}
        </p>
      )}

      {isPending && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setApproveOpen(true)}>Approve</Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit & Approve
            </Button>
            <Button
              variant="secondary"
              onClick={() => setRegenerateOpen(true)}
              disabled={isRegenerating}
            >
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
            <Button variant="ghost" onClick={() => setSkipOpen(true)}>
              Skip
            </Button>
          </div>
        </>
      )}

      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          Delete removes this post from your workspace. This can’t be undone
          from the app.
        </p>
        <Button
          variant="destructive"
          className="gap-2"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          Delete post
        </Button>
      </div>

      {post.reviews.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium">Review History</h3>
            <div className="relative space-y-4 border-l-2 border-muted pl-4">
              {post.reviews.map((review) => (
                <div key={review.id} className="relative">
                  <span className="absolute -left-[21px] top-1 size-3 rounded-full border-2 border-bg-surface bg-accent" />
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-bg-surface-hover px-2 py-0.5 text-caption">
                        {review.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(
                          new Date(review.created_at),
                          "MMM d, yyyy h:mm a",
                        )}
                      </span>
                    </div>
                    {review.feedback && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {review.feedback}
                      </p>
                    )}
                    {review.edited_caption && (
                      <p className="mt-2 text-sm">
                        Edited caption: {review.edited_caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve post?</DialogTitle>
            <DialogDescription>
              This will schedule the post for publishing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject post</DialogTitle>
            <DialogDescription>
              Optionally provide feedback for why this post was rejected.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback (optional)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate post</DialogTitle>
            <DialogDescription>
              Provide feedback to guide the AI regeneration. This may take
              several seconds.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={regenerateFeedback}
            onChange={(e) => setRegenerateFeedback(e.target.value)}
            placeholder="What should be improved?"
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => regenerateMutation.mutate()}
              disabled={
                !regenerateFeedback.trim() || regenerateMutation.isPending
              }
            >
              {regenerateMutation.isPending
                ? "Regenerating..."
                : "Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skipOpen} onOpenChange={setSkipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip post?</DialogTitle>
            <DialogDescription>
              This post will be marked as skipped and won&apos;t be published.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => skipMutation.mutate()}
              disabled={skipMutation.isPending}
            >
              {skipMutation.isPending ? "Skipping..." : "Skip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit & Approve</DialogTitle>
            <DialogDescription>
              Edit the post content. Saving will also approve and schedule it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Hashtags (comma-separated)</Label>
              <Input
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA</Label>
              <Input
                value={editCta}
                onChange={(e) => setEditCta(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => editMutation.mutate()}
              disabled={!editCaption.trim() || editMutation.isPending}
            >
              {editMutation.isPending ? "Saving..." : "Save & Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              The post will be removed from your workspace lists. This action
              can’t be undone from the app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
