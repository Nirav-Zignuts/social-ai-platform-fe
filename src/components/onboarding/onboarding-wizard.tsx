"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Camera, Sparkles, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useConnectInstagram } from "@/hooks/use-connect-instagram";
import { isAtWorkspaceLimit } from "@/lib/plans";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { WorkspaceLimitBanner } from "@/components/billing/workspace-limit-banner";
import {
  getOnboardingResumePath,
  getStepIndexFromQuery,
  getStepIndexFromStatus,
  isOnboardingComplete,
  ONBOARDING_STEPS,
} from "@/lib/onboarding";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessProfileStep } from "@/components/onboarding/business-profile-step";
import {
  KnowledgeUpload,
  useHasIndexedDocuments,
} from "@/components/forms/knowledge-upload";
import { AIConfigurationForm } from "@/components/forms/ai-configuration-form";
import { WorkspaceSettingsForm } from "@/components/forms/workspace-settings-form";
import { InstagramSetupGuide } from "@/components/instagram/instagram-setup-guide";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearOnboardingChatSessionId } from "@/lib/onboarding-chat";
import { clearStoredWorkspaceId } from "@/lib/workspace-routing";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  workspaceId?: string;
}

export function OnboardingWizard({ workspaceId }: OnboardingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState(workspaceId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const seededFromStatusRef = useRef(false);

  const activeWorkspaceId = createdWorkspaceId ?? workspaceId;
  const currentStepMeta = ONBOARDING_STEPS[step] ?? ONBOARDING_STEPS[0];
  const StepIcon = currentStepMeta.icon;

  const { data: workspaceData, isLoading: workspaceLoading } = useQuery({
    queryKey: ["workspace", activeWorkspaceId],
    queryFn: () => api.workspaces.get(activeWorkspaceId!),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: profileData } = useQuery({
    queryKey: ["business-profile", activeWorkspaceId],
    queryFn: () => api.workspaces.getBusinessProfile(activeWorkspaceId!),
    enabled: Boolean(activeWorkspaceId) && step >= 1,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const hasIndexed = useHasIndexedDocuments(activeWorkspaceId ?? "");

  // Resume after Instagram OAuth: ?step=scheduling
  useEffect(() => {
    const fromQuery = getStepIndexFromQuery(searchParams.get("step"));
    if (fromQuery == null) return;
    setStep(fromQuery);
    seededFromStatusRef.current = true;
    if (searchParams.has("step")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("step");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    }
  }, [searchParams]);

  // Seed step once from backend onboarding_status (don't clobber later progress).
  useEffect(() => {
    if (!workspaceId || !workspaceData?.workspace || seededFromStatusRef.current) {
      return;
    }
    setStep(getStepIndexFromStatus(workspaceData.workspace.onboarding_status));
    seededFromStatusRef.current = true;
  }, [workspaceData, workspaceId]);

  const { data: workspacesData, isLoading: workspacesListLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
    enabled: !workspaceId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const workspaceCount = workspacesData?.workspaces.length ?? 0;
  const { data: billingStatus } = useBillingStatus(!workspaceId);
  const workspaceLimit = billingStatus?.workspace_limit ?? 2;
  const atCreateLimit =
    !workspaceId && isAtWorkspaceLimit(workspaceCount, workspaceLimit);

  const createWorkspaceMutation = useMutation({
    mutationFn: () => {
      if (isAtWorkspaceLimit(workspaceCount, workspaceLimit)) {
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
      toast.error(
        e instanceof ApiError
          ? e.message
          : e.message || "Failed to create workspace",
      ),
  });

  const profileMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof api.workspaces.upsertBusinessProfile>[1],
    ) => api.workspaces.upsertBusinessProfile(activeWorkspaceId!, payload),
    onSuccess: () => {
      if (activeWorkspaceId) {
        clearOnboardingChatSessionId(activeWorkspaceId);
      }
      queryClient.invalidateQueries({
        queryKey: ["workspace", activeWorkspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["business-profile", activeWorkspaceId],
      });
      setStep(2);
      toast.success("Business profile saved");
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiError ? e.message : "Failed to save profile"),
  });

  const aiMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof api.workspaces.upsertAIConfiguration>[1],
    ) => api.workspaces.upsertAIConfiguration(activeWorkspaceId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace", activeWorkspaceId],
      });
      setStep(4);
      toast.success("AI configuration saved");
    },
    onError: (e: Error) =>
      toast.error(
        e instanceof ApiError ? e.message : "Failed to save AI config",
      ),
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
      toast.error(
        e instanceof ApiError ? e.message : "Failed to save settings",
      ),
  });

  const connectInstagramMutation = useConnectInstagram(
    activeWorkspaceId ?? "",
    activeWorkspaceId
      ? { type: "onboarding", workspaceId: activeWorkspaceId }
      : undefined,
  );

  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => api.workspaces.delete(activeWorkspaceId!),
    onSuccess: async () => {
      if (!activeWorkspaceId) return;
      clearStoredWorkspaceId(activeWorkspaceId);
      clearOnboardingChatSessionId(activeWorkspaceId);
      queryClient.removeQueries({
        queryKey: ["workspace", activeWorkspaceId],
      });
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace deleted");
      setDeleteOpen(false);

      const remaining = await api.workspaces.list();
      const next = remaining.workspaces[0];
      if (!next) {
        router.replace("/onboarding");
        return;
      }
      if (isOnboardingComplete(next.onboarding_status)) {
        router.replace(`/dashboard?workspace=${next.id}`);
      } else {
        router.replace(getOnboardingResumePath(next.id));
      }
    },
    onError: (e: Error) =>
      toast.error(
        e instanceof ApiError ? e.message : "Failed to delete workspace",
      ),
  });

  const canDeleteWorkspace = Boolean(activeWorkspaceId) && step >= 1;

  if (workspaceId && workspaceLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!workspaceId && workspacesListLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
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
    <div
      className={cn(
        "relative mx-auto",
        step === 1 ? "max-w-6xl" : "max-w-4xl",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 h-48 opacity-80"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 0%, rgba(108,92,231,0.18), transparent 70%)",
        }}
      />

      <div className="relative space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
              <Sparkles className="size-3.5" />
              Workspace onboarding
            </div>
            <h1 className="mt-4 text-page-title">Build your operating space</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
              Chat through your brand profile, then finish knowledge, AI voice,
              Instagram, and scheduling — before the first draft.
            </p>
          </div>
          {workspaceData?.workspace?.name && (
            <p className="rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-sm text-text-secondary">
              Working on{" "}
              <span className="font-medium text-text-primary">
                {workspaceData.workspace.name}
              </span>
            </p>
          )}
        </header>

        <div className="rounded-2xl border border-border-subtle bg-bg-surface/80 p-5 backdrop-blur-sm sm:p-6">
          <OnboardingStepper currentStep={step} />
        </div>

        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="border-b border-border-subtle px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <StepIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-caption">
                  {currentStepMeta.hint}
                </p>
                <h2 className="mt-1 text-section-header">
                  {currentStepMeta.title}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {currentStepMeta.description}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            {step === 0 && !workspaceId && (
              <div className="mx-auto max-w-lg space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="workspace_name">Workspace name</Label>
                  <Input
                    id="workspace_name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Bloom Coffee"
                    required
                    className="h-11"
                  />
                  <p className="text-caption">
                    You can rename this later in workspace settings.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => createWorkspaceMutation.mutate()}
                  disabled={
                    !workspaceName.trim() || createWorkspaceMutation.isPending
                  }
                >
                  {createWorkspaceMutation.isPending
                    ? "Creating..."
                    : "Continue"}
                  {!createWorkspaceMutation.isPending && (
                    <ArrowRight className="size-4" />
                  )}
                </Button>
              </div>
            )}

            {step === 1 && activeWorkspaceId && (
              <BusinessProfileStep
                workspaceId={activeWorkspaceId}
                initialData={profileData?.business_profile}
                onSubmit={async (data) => {
                  await profileMutation.mutateAsync(data);
                }}
                isSubmitting={profileMutation.isPending}
              />
            )}

            {step === 2 && activeWorkspaceId && (
              <div className="space-y-6">
                <KnowledgeUpload workspaceId={activeWorkspaceId} />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => setStep(3)}
                    disabled={!hasIndexed}
                  >
                    Continue
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && activeWorkspaceId && (
              <AIConfigurationForm
                onSubmit={async (data) => {
                  await aiMutation.mutateAsync(data);
                }}
                isSubmitting={aiMutation.isPending}
                submitLabel="Continue"
              />
            )}

            {step === 4 && activeWorkspaceId && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border-subtle bg-bg-base/50 p-5">
                  <p className="text-sm text-text-secondary">
                    Connect an Instagram Professional account linked to a
                    Facebook Page. You can skip and finish this later from
                    settings.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => connectInstagramMutation.mutate()}
                      disabled={connectInstagramMutation.isPending}
                    >
                      <Camera className="size-4" />
                      {connectInstagramMutation.isPending
                        ? "Connecting..."
                        : "Connect Instagram"}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setStep(5)}
                    >
                      Skip for now
                    </Button>
                  </div>
                </div>
                <InstagramSetupGuide defaultOpen />
              </div>
            )}

            {step === 5 && activeWorkspaceId && (
              <WorkspaceSettingsForm
                initialData={workspaceData?.workspace}
                showName={false}
                onSubmit={async (data) => {
                  await schedulingMutation.mutateAsync(data);
                }}
                isSubmitting={schedulingMutation.isPending}
                submitLabel="Finish setup"
              />
            )}
          </div>
        </section>

        {canDeleteWorkspace && (
          <div className="rounded-2xl border border-status-rejected/30 bg-status-rejected/5 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-status-rejected">
                  Delete this workspace
                </p>
                <p className="mt-1 text-caption">
                  Cancel setup and remove this workspace and everything created
                  for it so far.
                </p>
              </div>
              <Button
                type="button"
                variant="destructive"
                className="shrink-0 gap-2"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete workspace
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this workspace?</DialogTitle>
            <DialogDescription>
              Deletes this workspace and all related content from setup. You can
              create a new workspace afterward.
            </DialogDescription>
          </DialogHeader>
          {workspaceData?.workspace?.name && (
            <p className="rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary">
              You&apos;re deleting{" "}
              <span className="font-medium text-text-primary">
                {workspaceData.workspace.name}
              </span>
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteWorkspaceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteWorkspaceMutation.mutate()}
              disabled={deleteWorkspaceMutation.isPending}
            >
              {deleteWorkspaceMutation.isPending
                ? "Deleting..."
                : "Delete workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
