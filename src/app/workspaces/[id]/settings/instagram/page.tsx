"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { InstagramConnectionPanel } from "@/components/instagram/instagram-connection-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InstagramSettingsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);

  return (
    <AppShell workspaceId={workspaceId}>
      <PageHeader
        title="Instagram"
        description="Manage the account used to publish approved content"
      />
      <SettingsNav workspaceId={workspaceId} />
      <InstagramConnectionPanel workspaceId={workspaceId} />
    </AppShell>
  );
}
