import { AppShell } from "@/components/layout/app-shell";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <AppShell>
      <OnboardingWizard />
    </AppShell>
  );
}
