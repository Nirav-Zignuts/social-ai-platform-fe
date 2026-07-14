"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleOAuthCallbackHandler } from "@/components/auth/google-oauth-callback-handler";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postAuthRedirect = searchParams.get("redirect") ?? undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") !== "1") return;
    setShowVerifiedBanner(true);
    toast.success("Email verified — you can sign in");
    const url = new URL(window.location.href);
    url.searchParams.delete("verified");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [searchParams]);

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: () => {
      const redirect = searchParams.get("redirect") ?? "/dashboard";
      router.push(redirect);
      toast.success("Signed in");
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Login failed",
      );
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        {showVerifiedBanner && (
          <Alert className="mb-4 border-status-approved/30 bg-status-approved/10">
            <AlertDescription className="text-status-approved">
              Your email is verified. Sign in to continue.
            </AlertDescription>
          </Alert>
        )}
        <GoogleOAuthCallbackHandler />
        <GoogleSignInButton postAuthRedirect={postAuthRedirect} />
        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-surface px-2 text-caption text-text-secondary">
            or
          </span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-caption">
            No account?{" "}
            <Link href="/register" className="text-accent hover:text-accent-hover">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
