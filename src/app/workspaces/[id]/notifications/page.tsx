"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationPageContent } from "@/components/notifications/notification-list";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NotificationsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);

  return (
    <AppShell workspaceId={workspaceId}>
      <NotificationPageContent workspaceId={workspaceId} />
    </AppShell>
  );
}
