"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PublicSiteHeader } from "@/components/marketing/public-site-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Content Generation",
    description:
      "Generate on-brand Instagram posts grounded in your business knowledge.",
  },
  {
    icon: UserCheck,
    title: "Human Review Built In",
    description:
      "Approve, edit, or reject every draft before anything goes live.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base Grounding",
    description:
      "Upload docs so AI stays aligned with your voice, offers, and policies.",
  },
  {
    icon: CalendarClock,
    title: "Automated Scheduling",
    description:
      "Approved posts schedule cleanly to Instagram without manual busywork.",
  },
] as const;

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <PublicSiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border-subtle">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(70% 55% at 50% -10%, rgba(108,92,231,0.22), transparent 60%)",
            }}
          />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start px-4 py-20 sm:px-6 sm:py-28">
            <p className="text-sm font-semibold tracking-tight text-text-primary">
              Social AI
            </p>
            <h1 className="mt-4 max-w-3xl text-display">
              AI that runs your Instagram, with you in control
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
              Generate, review, and schedule Instagram content from a workspace
              built for operators who still want the final say.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                )}
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-section-header">Built for operators</h2>
            <p className="mt-2 text-sm text-text-secondary">
              The core loop that keeps content shipping without losing brand
              control.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border-subtle bg-bg-surface p-5"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-bg-base text-accent">
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-4 text-sm font-medium text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
