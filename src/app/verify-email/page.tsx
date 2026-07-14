"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const handledRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    token
      ? "Verifying your email…"
      : "Missing verification token. Request a new link or sign in.",
  );

  useEffect(() => {
    if (!token || handledRef.current) return;
    handledRef.current = true;

    let redirectTimer: number | undefined;

    api.auth
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Email verified successfully. You can sign in now.");
        toast.success("Email verified");
        redirectTimer = window.setTimeout(() => {
          router.replace("/login?verified=1");
        }, 1400);
      })
      .catch((error: Error) => {
        setStatus("error");
        setMessage(
          error instanceof ApiError
            ? error.message
            : "Verification failed. The link may be invalid or expired.",
        );
        toast.error(
          error instanceof ApiError ? error.message : "Verification failed",
        );
      });

    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [router, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          {status === "loading" && (
            <Loader2 className="mx-auto size-10 animate-spin text-accent" />
          )}
          {status === "success" && (
            <CheckCircle2 className="mx-auto size-10 text-status-approved" />
          )}
          {status === "error" && (
            <XCircle className="mx-auto size-10 text-status-rejected" />
          )}
          <CardTitle>
            {status === "loading" && "Verifying email"}
            {status === "success" && "Email verified"}
            {status === "error" && "Verification failed"}
          </CardTitle>
          <p className="text-caption">{message}</p>
        </CardHeader>
        {status !== "loading" && (
          <CardContent>
            <Button
              className="w-full"
              onClick={() =>
                router.replace(
                  status === "success" ? "/login?verified=1" : "/login",
                )
              }
            >
              {status === "success" ? "Continue to sign in" : "Back to sign in"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-base p-6">
          <Skeleton className="h-64 w-full max-w-md rounded-lg" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
