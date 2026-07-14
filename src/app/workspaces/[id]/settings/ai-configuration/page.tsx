"use client";

import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { AIConfigurationForm } from "@/components/forms/ai-configuration-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AIConfigurationSettingsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ai-configuration", workspaceId],
    queryFn: () => api.workspaces.getAIConfiguration(workspaceId),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.workspaces.upsertAIConfiguration>[1]) =>
      api.workspaces.upsertAIConfiguration(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-configuration", workspaceId],
      });
      toast.success("AI configuration saved");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to save"),
  });

  return (
    <AppShell workspaceId={workspaceId}>
      <PageHeader
        title="AI configuration"
        description="Control tone, length, and style of generated content"
      />
      <SettingsNav workspaceId={workspaceId} />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <AIConfigurationForm
              initialData={data?.ai_configuration}
              onSubmit={async (payload) => {
                await mutation.mutateAsync(payload);
              }}
              isSubmitting={mutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
