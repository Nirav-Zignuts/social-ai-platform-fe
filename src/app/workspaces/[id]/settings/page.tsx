"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { clearStoredWorkspaceId } from "@/lib/workspace-routing";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { WorkspaceSettingsForm } from "@/components/forms/workspace-settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspaceSettingsPage({ params }: PageProps) {
  const { id: workspaceId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: () => api.workspaces.delete(workspaceId),
    onSuccess: async () => {
      clearStoredWorkspaceId(workspaceId);
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.removeQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Workspace deleted");
      setDeleteOpen(false);

      const remaining = await api.workspaces.list();
      const next = remaining.workspaces[0];
      if (next) {
        router.replace(`/dashboard?workspace=${next.id}`);
      } else {
        router.replace("/onboarding");
      }
    },
    onError: (e: Error) =>
      toast.error(
        e instanceof ApiError ? e.message : "Failed to delete workspace",
      ),
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
              key={workspaceId}
              initialData={data?.workspace}
              onSubmit={async (payload) => {
                await mutation.mutateAsync(payload);
              }}
              isSubmitting={mutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-status-rejected/30">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h3 className="text-sm font-medium text-status-rejected">
              Danger zone
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Deletes this workspace and all related content (posts, documents,
              Instagram connection, onboarding chat). This can&apos;t be undone
              from the app.
            </p>
          </div>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete workspace
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this workspace?</DialogTitle>
            <DialogDescription>
              Deletes this workspace and all content — posts, knowledge docs,
              Instagram connection, and onboarding chat. Soft-deleted in the
              database; Chroma vectors for this workspace are removed.
            </DialogDescription>
          </DialogHeader>
          {data?.workspace?.name && (
            <p className="rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary">
              You&apos;re deleting{" "}
              <span className="font-medium text-text-primary">
                {data.workspace.name}
              </span>
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : "Delete workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
