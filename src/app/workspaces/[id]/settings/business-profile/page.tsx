"use client";

import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BusinessProfileSettingsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["business-profile", workspaceId],
    queryFn: () => api.workspaces.getBusinessProfile(workspaceId),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.workspaces.upsertBusinessProfile>[1]) =>
      api.workspaces.upsertBusinessProfile(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-profile", workspaceId],
      });
      toast.success("Business profile saved");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to save"),
  });

  return (
    <AppShell workspaceId={workspaceId}>
      <PageHeader
        title="Business profile"
        description="Brand context used for AI content generation"
      />
      <SettingsNav workspaceId={workspaceId} />
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <BusinessProfileForm
              key={workspaceId}
              initialData={data?.business_profile}
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
