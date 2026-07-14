"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  workspaceId: string;
  unreadOnly?: boolean;
  compact?: boolean;
  limit?: number;
}

function filterNotifications(
  notifications: Notification[],
  filter: "all" | "unread" | "read",
) {
  if (filter === "unread") return notifications.filter((n) => !n.read_at);
  if (filter === "read") return notifications.filter((n) => n.read_at);
  return notifications;
}

export function NotificationList({
  workspaceId,
  unreadOnly = false,
  compact = false,
  limit = 50,
}: NotificationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", workspaceId, { unreadOnly, limit }],
    queryFn: () => api.notifications.list(workspaceId, unreadOnly, limit),
    refetchInterval: compact ? 30000 : 15000,
  });

  const notifications = data?.notifications ?? [];

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      api.notifications.markRead(workspaceId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", workspaceId],
      });
      toast.success("Marked as read");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to mark as read"),
  });

  const handleOpen = async (notification: Notification) => {
    if (!notification.read_at) {
      await markReadMutation.mutateAsync(notification.id);
    }
    if (notification.post_id) {
      router.push(
        `/workspaces/${workspaceId}/posts/${notification.post_id}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">Failed to load notifications</p>
    );
  }

  if (notifications.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {unreadOnly ? "No unread notifications" : "No notifications yet"}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2", compact && "max-h-80 overflow-y-auto")}>
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className={cn(
            "rounded-lg border p-3 transition-colors",
            !notification.read_at && "border-accent/30 bg-accent/5",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => handleOpen(notification)}
              disabled={!notification.post_id}
            >
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-sm",
                    notification.read_at
                      ? "text-muted-foreground"
                      : "font-medium",
                  )}
                >
                  {notification.payload?.message ?? notification.type}
                </p>
                {!notification.read_at && (
                  <span className="size-2 shrink-0 rounded-full bg-accent" />
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {compact
                  ? formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })
                  : format(
                      new Date(notification.created_at),
                      "MMM d, yyyy h:mm a",
                    )}
              </p>
            </button>
            <div className="flex shrink-0 items-center gap-1">
              {!notification.read_at && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Mark as read"
                  onClick={() => markReadMutation.mutate(notification.id)}
                  disabled={markReadMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {notification.post_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Open post"
                  onClick={() => handleOpen(notification)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface NotificationPageContentProps {
  workspaceId: string;
}

export function NotificationPageContent({
  workspaceId,
}: NotificationPageContentProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", workspaceId, { unreadOnly: false, limit: 100 }],
    queryFn: () => api.notifications.list(workspaceId, false, 100),
  });

  const all = data?.notifications ?? [];
  const unreadCount = all.filter((n) => !n.read_at).length;
  const readCount = all.filter((n) => n.read_at).length;

  return (
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description="Post reviews, approvals, and system alerts"
          action={
            unreadCount > 0 ? (
              <span className="rounded-full bg-bg-surface-hover px-3 py-1 text-caption text-text-primary">
                {unreadCount} unread
              </span>
            ) : undefined
          }
        />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read ({readCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : all.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You'll see alerts here when posts need your attention."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All notifications</CardTitle>
                <CardDescription>
                  Click a notification to open the related post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationList workspaceId={workspaceId} limit={100} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : unreadCount === 0 ? (
            <EmptyState
              icon={Bell}
              title="All caught up"
              description="You have no unread notifications."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Unread</CardTitle>
              </CardHeader>
              <CardContent>
                <FilteredNotificationList
                  workspaceId={workspaceId}
                  filter="unread"
                  source={all}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : readCount === 0 ? (
            <EmptyState
              icon={Bell}
              title="No read notifications"
              description="Notifications you've opened will appear here."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Read</CardTitle>
              </CardHeader>
              <CardContent>
                <FilteredNotificationList
                  workspaceId={workspaceId}
                  filter="read"
                  source={all}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FilteredNotificationList({
  workspaceId,
  filter,
  source,
}: {
  workspaceId: string;
  filter: "unread" | "read";
  source: Notification[];
}) {
  const filtered = filterNotifications(source, filter);
  const router = useRouter();
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      api.notifications.markRead(workspaceId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", workspaceId],
      });
      toast.success("Marked as read");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to mark as read"),
  });

  const handleOpen = async (notification: Notification) => {
    if (!notification.read_at) {
      await markReadMutation.mutateAsync(notification.id);
    }
    if (notification.post_id) {
      router.push(
        `/workspaces/${workspaceId}/posts/${notification.post_id}`,
      );
    }
  };

  return (
    <ul className="space-y-2">
      {filtered.map((notification) => (
        <li
          key={notification.id}
          className={cn(
            "rounded-lg border p-3",
            !notification.read_at && "border-accent/30 bg-accent/5",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => handleOpen(notification)}
              disabled={!notification.post_id}
            >
              <p
                className={cn(
                  "text-sm",
                  notification.read_at
                    ? "text-muted-foreground"
                    : "font-medium",
                )}
              >
                {notification.payload?.message ?? notification.type}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {format(
                  new Date(notification.created_at),
                  "MMM d, yyyy h:mm a",
                )}
              </p>
            </button>
            {filter === "unread" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markReadMutation.mutate(notification.id)}
                disabled={markReadMutation.isPending}
              >
                Mark read
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
