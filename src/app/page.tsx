"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  MessageSquareText,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PublicSiteFooter } from "@/components/marketing/public-site-footer";
import { PublicSiteHeader } from "@/components/marketing/public-site-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Conversational setup",
    description:
      "Describe your brand in chat. We draft the business profile — you review before anything is saved.",
  },
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

const CHAT_PREVIEW = [
  {
    role: "assistant" as const,
    text: "Hey! Let's set up your AI social profile — what's your business called?",
  },
  {
    role: "user" as const,
    text: "Leafling Urban Nursery",
  },
  {
    role: "assistant" as const,
    text: "Love that name. What industry are you in?",
  },
];

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
              Set up your brand by conversation, then generate, review, and
              schedule Instagram content — without giving up the final say.
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

        <section className="relative overflow-hidden border-b border-border-subtle">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(22,23,26,0.2), transparent 40%), radial-gradient(50% 40% at 80% 20%, rgba(108,92,231,0.12), transparent 70%)",
            }}
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                Onboarding
              </p>
              <h2 className="mt-3 text-section-header">
                Tell us about your brand in chat
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
                Skip the blank form. Answer a few natural questions, review the
                drafted profile, then continue the same stepper for knowledge,
                AI voice, Instagram, and scheduling.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-text-secondary">
                <li>Quick-reply chips when choices help; text input always available</li>
                <li>Captured fields update live as you answer</li>
                <li>Nothing saves until you confirm the draft</li>
              </ul>
            </div>

            <div
              aria-hidden
              className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                <span className="size-2 rounded-full bg-status-approved/80" />
                <span className="text-xs text-text-secondary">
                  Profile setup chat
                </span>
              </div>
              <div className="space-y-3 px-4 py-5">
                {CHAT_PREVIEW.map((message) => (
                  <div
                    key={message.text}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-accent text-white"
                          : "border border-border-subtle bg-bg-base text-text-primary",
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Retail — Plants & Gardening", "Food & Drink", "Services"].map(
                    (chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-secondary"
                      >
                        {chip}
                      </span>
                    ),
                  )}
                </div>
              </div>
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
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
      <PublicSiteFooter />
    </div>
  );
}
