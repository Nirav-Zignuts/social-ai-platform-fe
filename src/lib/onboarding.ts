import type { OnboardingStatus } from "./types";

export const ONBOARDING_STEPS = [
  { id: "workspace", title: "Workspace", description: "Name your workspace" },
  {
    id: "profile",
    title: "Business Profile",
    description: "Tell us about your business",
  },
  {
    id: "knowledge",
    title: "Knowledge Base",
    description: "Upload brand documents",
  },
  {
    id: "ai",
    title: "AI Configuration",
    description: "Set content preferences",
  },
  {
    id: "instagram",
    title: "Connect Instagram",
    description: "Link your account",
  },
  {
    id: "scheduling",
    title: "Scheduling",
    description: "Set posting preferences",
  },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

const STATUS_TO_STEP_INDEX: Record<OnboardingStatus, number> = {
  workspace_created: 1,
  profile_added: 2,
  knowledge_added: 3,
  ai_configured: 4,
  completed: 5,
};

export function getStepIndexFromStatus(status: OnboardingStatus): number {
  return STATUS_TO_STEP_INDEX[status] ?? 0;
}

export function isOnboardingComplete(status: OnboardingStatus): boolean {
  return status === "completed";
}
