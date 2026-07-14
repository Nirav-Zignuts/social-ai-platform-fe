"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationList } from "@/components/notifications/notification-list";

interface NotificationBellProps {
  workspaceId: string;
}

export function NotificationBell({ workspaceId }: NotificationBellProps) {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["notifications", workspaceId, { unreadOnly: false, limit: 50 }],
    queryFn: () => api.notifications.list(workspaceId, false, 50),
    refetchInterval: 60_000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <NotificationList workspaceId={workspaceId} compact limit={8} />
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-primary"
          onClick={() =>
            router.push(`/workspaces/${workspaceId}/notifications`)
          }
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
