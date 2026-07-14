import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function OnboardingWorkspacePage({ params }: PageProps) {
  const { workspaceId } = await params;
  return <OnboardingWizard workspaceId={workspaceId} />;
}
