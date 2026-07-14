import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Brain,
  CalendarClock,
  Camera,
  FileText,
  Library,
} from "lucide-react";
import type { OnboardingStatus } from "./types";

export const ONBOARDING_STEPS = [
  {
    id: "workspace",
    title: "Workspace",
    description: "Name the brand space you’ll run from",
    hint: "One workspace = one brand or client.",
    icon: Building2,
  },
  {
    id: "profile",
    title: "Business profile",
    description: "Tell AI who you are and who you serve",
    hint: "Better briefs mean stronger drafts.",
    icon: FileText,
  },
  {
    id: "knowledge",
    title: "Knowledge base",
    description: "Ground content in your real brand assets",
    hint: "Upload guides, offers, or tone docs.",
    icon: Library,
  },
  {
    id: "ai",
    title: "AI configuration",
    description: "Set voice, goals, and content preferences",
    hint: "You stay in control of tone and risk.",
    icon: Brain,
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "Connect the account you’ll publish to",
    hint: "Requires a Business/Creator account + Page.",
    icon: Camera,
  },
  {
    id: "scheduling",
    title: "Scheduling",
    description: "Choose when approved posts go live",
    hint: "Finish setup and open the dashboard.",
    icon: CalendarClock,
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  hint: string;
  icon: LucideIcon;
}>;

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
