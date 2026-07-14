"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export function GoogleOAuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { completeOAuthLogin } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const error = searchParams.get("error");
    if (error) {
      handledRef.current = true;
      toast.error(decodeURIComponent(error.replace(/\+/g, " ")));
      router.replace("/login");
      return;
    }

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    handledRef.current = true;
    const redirect = searchParams.get("redirect") ?? "/dashboard";

    void completeOAuthLogin({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: searchParams.get("token_type") ?? "bearer",
    })
      .then(() => {
        toast.success("Signed in with Google");
        router.replace(redirect);
      })
      .catch(() => {
        toast.error("Google sign-in failed");
        router.replace("/login");
      });
  }, [completeOAuthLogin, router, searchParams]);

  const isProcessing =
    Boolean(searchParams.get("access_token") && searchParams.get("refresh_token")) ||
    Boolean(searchParams.get("error"));

  if (!isProcessing) return null;

  return (
    <p className="mb-4 text-center text-caption text-text-secondary">
      Completing Google sign-in...
    </p>
  );
}
