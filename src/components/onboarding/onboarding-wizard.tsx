"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { useConnectInstagram } from "@/hooks/use-connect-instagram";
import { isAtWorkspaceLimit } from "@/lib/plans";
import { WorkspaceLimitBanner } from "@/components/billing/workspace-limit-banner";
import {
  getStepIndexFromStatus,
  ONBOARDING_STEPS,
} from "@/lib/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import {
  KnowledgeUpload,
  useHasIndexedDocuments,
} from "@/components/forms/knowledge-upload";
import { AIConfigurationForm } from "@/components/forms/ai-configuration-form";
import { WorkspaceSettingsForm } from "@/components/forms/workspace-settings-form";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { InstagramSetupGuide } from "@/components/instagram/instagram-setup-guide";

interface OnboardingWizardProps {
  workspaceId?: string;
}

export function OnboardingWizard({ workspaceId }: OnboardingWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState(workspaceId);

  const activeWorkspaceId = createdWorkspaceId ?? workspaceId;

  const { data: workspaceData, isLoading: workspaceLoading } = useQuery({
    queryKey: ["workspace", activeWorkspaceId],
    queryFn: () => api.workspaces.get(activeWorkspaceId!),
    enabled: Boolean(activeWorkspaceId),
  });

  const { data: profileData } = useQuery({
    queryKey: ["business-profile", activeWorkspaceId],
    queryFn: () => api.workspaces.getBusinessProfile(activeWorkspaceId!),
    enabled: Boolean(activeWorkspaceId) && step >= 1,
    retry: false,
  });

  const hasIndexed = useHasIndexedDocuments(activeWorkspaceId ?? "");

  useEffect(() => {
    if (workspaceData?.workspace) {
      const index = getStepIndexFromStatus(
        workspaceData.workspace.onboarding_status,
      );
      if (workspaceId) {
        setStep(index);
      }
    }
  }, [workspaceData, workspaceId]);

  const { data: workspacesData, isLoading: workspacesListLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
    enabled: !workspaceId,
  });

  const workspaceCount = workspacesData?.workspaces.length ?? 0;
  const atCreateLimit = !workspaceId && isAtWorkspaceLimit(workspaceCount);

  const createWorkspaceMutation = useMutation({
    mutationFn: () => {
      if (isAtWorkspaceLimit(workspaceCount)) {
        throw new Error("Workspace limit reached on your current plan.");
      }
      return api.workspaces.create({ name: workspaceName });
    },
    onSuccess: (data) => {
      setCreatedWorkspaceId(data.workspace.id);
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setStep(1);
      router.replace(`/onboarding/${data.workspace.id}`);
      toast.success("Workspace created");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : e.message || "Failed to create workspace"),
  });

  const profileMutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.workspaces.upsertBusinessProfile>[1]) =>
      api.workspaces.upsertBusinessProfile(activeWorkspaceId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeWorkspaceId] });
      setStep(2);
      toast.success("Business profile saved");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to save profile"),
  });

  const aiMutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.workspaces.upsertAIConfiguration>[1]) =>
      api.workspaces.upsertAIConfiguration(activeWorkspaceId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeWorkspaceId] });
      setStep(4);
      toast.success("AI configuration saved");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to save AI config"),
  });

  const schedulingMutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.workspaces.update>[1]) =>
      api.workspaces.update(activeWorkspaceId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Onboarding complete!");
      router.push("/dashboard");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to save settings"),
  });

  const connectInstagramMutation = useConnectInstagram(activeWorkspaceId ?? "");

  if (workspaceId && workspaceLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspaceId && workspacesListLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (atCreateLimit) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-page-title">Create workspace</h1>
          <p className="mt-1 text-caption">
            Your Free plan allows 2 workspaces. Upgrade to add more.
          </p>
        </div>
        <WorkspaceLimitBanner workspaceCount={workspaceCount} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 border-b border-border-subtle pb-6">
        <h1 className="text-page-title">Workspace setup</h1>
        <p className="mt-1 text-caption">
          Configure your workspace for AI content generation
        </p>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {ONBOARDING_STEPS.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-caption transition-colors duration-150",
              i === step
                ? "bg-accent text-white"
                : i < step
                  ? "bg-bg-surface-hover text-text-primary"
                  : "bg-bg-surface text-text-secondary",
            )}
          >
            <span className="font-medium tabular-nums">{i + 1}</span>
            <span className="hidden sm:inline">{s.title}</span>
          </div>
        ))}
      </div>

      {step === 0 && !workspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>{ONBOARDING_STEPS[0].title}</CardTitle>
            <CardDescription>{ONBOARDING_STEPS[0].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace_name">Workspace Name</Label>
              <Input
                id="workspace_name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Brand"
                required
              />
            </div>
            <Button
              onClick={() => createWorkspaceMutation.mutate()}
              disabled={!workspaceName.trim() || createWorkspaceMutation.isPending}
            >
              {createWorkspaceMutation.isPending ? "Creating..." : "Continue"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && activeWorkspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>{ONBOARDING_STEPS[1].title}</CardTitle>
            <CardDescription>{ONBOARDING_STEPS[1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessProfileForm
              initialData={profileData?.business_profile}
              onSubmit={async (data) => {
                await profileMutation.mutateAsync(data);
              }}
              isSubmitting={profileMutation.isPending}
              submitLabel="Continue"
            />
          </CardContent>
        </Card>
      )}

      {step === 2 && activeWorkspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>{ONBOARDING_STEPS[2].title}</CardTitle>
            <CardDescription>{ONBOARDING_STEPS[2].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <KnowledgeUpload workspaceId={activeWorkspaceId} />
            <div className="flex gap-2">
              <Button
                onClick={() => setStep(3)}
                disabled={!hasIndexed}
              >
                Continue
              </Button>
              <Button variant="outline" onClick={() => setStep(3)}>
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && activeWorkspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>{ONBOARDING_STEPS[3].title}</CardTitle>
            <CardDescription>{ONBOARDING_STEPS[3].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <AIConfigurationForm
              onSubmit={async (data) => {
                await aiMutation.mutateAsync(data);
              }}
              isSubmitting={aiMutation.isPending}
              submitLabel="Continue"
            />
          </CardContent>
        </Card>
      )}

      {step === 4 && activeWorkspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>{ONBOARDING_STEPS[4].title}</CardTitle>
            <CardDescription>{ONBOARDING_STEPS[4].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => connectInstagramMutation.mutate()}
              disabled={connectInstagramMutation.isPending}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {connectInstagramMutation.isPending
                ? "Connecting..."
                : "Connect Instagram"}
            </Button>
            <p className="text-caption">
              You&apos;ll be redirected to Meta to authorize access, then
              returned to workspace settings.
            </p>
            <InstagramSetupGuide defaultOpen />
            <Button variant="outline" onClick={() => setStep(5)}>
              Skip for now
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 5 && activeWorkspaceId && (
        <Card>
          <CardHeader>
            <CardTitle>{ONBOARDING_STEPS[5].title}</CardTitle>
            <CardDescription>{ONBOARDING_STEPS[5].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceSettingsForm
              initialData={workspaceData?.workspace}
              showName={false}
              onSubmit={async (data) => {
                await schedulingMutation.mutateAsync(data);
              }}
              isSubmitting={schedulingMutation.isPending}
              submitLabel="Finish Setup"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
