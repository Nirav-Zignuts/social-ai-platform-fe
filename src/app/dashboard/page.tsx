import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </AppShell>
  );
}
