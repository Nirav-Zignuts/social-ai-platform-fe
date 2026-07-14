"use client";

import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { WorkspaceSettingsForm } from "@/components/forms/workspace-settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspaceSettingsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => api.workspaces.get(workspaceId),
  });

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.workspaces.update>[1]) =>
      api.workspaces.update(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to save"),
  });

  return (
    <AppShell workspaceId={workspaceId}>
      <PageHeader
        title="Settings"
        description="Workspace name, schedule, and approval preferences"
      />
      <SettingsNav workspaceId={workspaceId} />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <WorkspaceSettingsForm
              initialData={data?.workspace}
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
