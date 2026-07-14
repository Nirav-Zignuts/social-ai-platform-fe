"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InstagramCallbackLandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Loader2 className="mx-auto size-10 animate-spin text-accent" />
          <CardTitle>Redirecting</CardTitle>
          <p className="mt-2 text-caption">
            Instagram OAuth is handled by the backend. Redirecting you to the
            dashboard…
          </p>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
