import { Suspense } from "react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingShell>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        }
      >
        {children}
      </Suspense>
    </OnboardingShell>
  );
}
