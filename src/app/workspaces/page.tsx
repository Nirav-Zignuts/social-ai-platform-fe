"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspacesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
      <Skeleton className="h-8 w-48" />
    </div>
  );
}
