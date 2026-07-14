import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import InstagramCallbackLandingPage from "./page-client";

export default function Page() {
  return (
    <Suspense
      fallback={
        <Skeleton className="mx-auto mt-20 h-64 w-full max-w-md rounded-lg" />
      }
    >
      <InstagramCallbackLandingPage />
    </Suspense>
  );
}
