"use client";

import { use } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { KnowledgeUpload } from "@/components/forms/knowledge-upload";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function KnowledgeBaseSettingsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);

  return (
    <AppShell workspaceId={workspaceId}>
      <PageHeader
        title="Knowledge base"
        description="Documents that inform your brand voice and content"
      />
      <SettingsNav workspaceId={workspaceId} />
      <Card>
        <CardContent className="pt-6">
          <KnowledgeUpload
            workspaceId={workspaceId}
            showDelete
            pollWhileProcessing
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
