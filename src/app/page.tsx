"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  MessageSquareText,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PhoneShowcaseSection } from "@/components/marketing/phone-showcase-section";
import { ProductLogo } from "@/components/marketing/product-logo";
import { PublicSiteFooter } from "@/components/marketing/public-site-footer";
import { PublicSiteHeader } from "@/components/marketing/public-site-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LOOP = [
  {
    step: "01",
    title: "Chat your brand in",
    description: "Describe the business once. We draft the profile for review.",
  },
  {
    step: "02",
    title: "AI drafts posts",
    description: "Grounded in your docs, voice, and offers — not generic filler.",
  },
  {
    step: "03",
    title: "You approve",
    description: "Edit, reject, or ship. Nothing publishes without your say.",
  },
  {
    step: "04",
    title: "Schedule & go live",
    description: "Approved content lands on Instagram on your timeline.",
  },
] as const;

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Conversational setup",
    description:
      "Describe your brand in chat. We draft the business profile — you review before anything is saved.",
    span: "sm:col-span-2",
  },
  {
    icon: Sparkles,
    title: "AI content generation",
    description:
      "On-brand Instagram posts grounded in your business knowledge.",
    span: "",
  },
  {
    icon: UserCheck,
    title: "Human review built in",
    description:
      "Approve, edit, or reject every draft before anything goes live.",
    span: "",
  },
  {
    icon: BookOpen,
    title: "Knowledge grounding",
    description:
      "Upload docs so AI stays aligned with your voice, offers, and policies.",
    span: "",
  },
  {
    icon: CalendarClock,
    title: "Automated scheduling",
    description:
      "Approved posts schedule cleanly to Instagram without manual busywork.",
    span: "sm:col-span-2 lg:col-span-1",
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
    <div className="min-h-screen overflow-x-hidden bg-bg-base text-text-primary">
      <PublicSiteHeader />
      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border-subtle">
          <div
            aria-hidden
            className="landing-orb pointer-events-none absolute -left-24 top-0 size-[420px] rounded-full bg-accent/20 blur-[100px]"
          />
          <div
            aria-hidden
            className="landing-orb-slow pointer-events-none absolute -right-20 top-24 size-[380px] rounded-full bg-[#4DB88A]/15 blur-[110px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.045) 1px, transparent 0)",
              backgroundSize: "28px 28px",
              maskImage:
                "linear-gradient(180deg, black 0%, black 55%, transparent 100%)",
            }}
          />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
            <div className="landing-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
              <Sparkles className="size-3.5" />
              Instagram operating system
            </div>

            <div className="landing-fade-up landing-fade-up-delay-1 mt-6">
              <ProductLogo size="md" href={null} />
            </div>

            <h1 className="landing-fade-up landing-fade-up-delay-1 landing-display mt-6 max-w-3xl">
              AI that runs your Instagram,{" "}
              <span className="bg-gradient-to-r from-accent via-[#a29bfe] to-[#4DB88A] bg-clip-text text-transparent">
                with you in control
              </span>
            </h1>

            <p className="landing-fade-up landing-fade-up-delay-2 mt-5 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              Set up your brand by conversation, then generate, review, and
              schedule Instagram content — without giving up the final say.
            </p>

            <div className="landing-fade-up landing-fade-up-delay-3 mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 shadow-[0_0_32px_rgba(108,92,231,0.35)]",
                )}
              >
                Get started free
                <ArrowRight className="size-4" />
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

            <div className="landing-fade-up landing-fade-up-delay-3 mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
              {["Human approval required", "Knowledge-grounded drafts", "Schedule to Instagram"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="size-3.5 text-status-approved" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="relative border-b border-border-subtle">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                The loop
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary sm:text-[1.75rem]">
                From brand chat to a live post
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
                One continuous operating loop — not five disconnected tools.
              </p>
            </div>

            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LOOP.map((item, index) => (
                <li
                  key={item.step}
                  className="landing-glass relative rounded-2xl p-5"
                >
                  <span className="font-mono text-xs text-accent/80">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                  {index < LOOP.length - 1 && (
                    <ArrowRight
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-accent/40 lg:block"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Onboarding chat ── */}
        <section className="relative overflow-hidden border-b border-border-subtle">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 60% at 85% 30%, rgba(108,92,231,0.14), transparent 65%)",
            }}
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.15fr] lg:items-center">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                Onboarding
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary sm:text-[1.75rem]">
                Tell us about your brand in chat
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary sm:text-base">
                Skip the blank form. Answer a few natural questions, review the
                drafted profile, then continue for knowledge, AI voice,
                Instagram, and scheduling.
              </p>
              <ul className="mt-7 space-y-3 text-sm text-text-secondary">
                {[
                  "Quick-reply chips when choices help",
                  "Captured fields update live as you answer",
                  "Nothing saves until you confirm the draft",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-status-approved" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              aria-hidden
              className="landing-glass overflow-hidden rounded-2xl"
            >
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <span className="size-2 rounded-full bg-status-approved/90" />
                <span className="size-2 rounded-full bg-status-pending/70" />
                <span className="size-2 rounded-full bg-status-rejected/50" />
                <span className="ml-2 text-xs text-text-secondary">
                  Profile setup chat
                </span>
              </div>
              <div className="space-y-3 px-4 py-5">
                {CHAT_PREVIEW.map((message, i) => (
                  <div
                    key={message.text}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                    style={{
                      animationDelay: `${0.15 * i}s`,
                    }}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        message.role === "user"
                          ? "bg-accent text-white shadow-[0_8px_24px_rgba(108,92,231,0.35)]"
                          : "border border-white/[0.06] bg-bg-base/80 text-text-primary",
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
                        className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent"
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

        <PhoneShowcaseSection />

        {/* ── Features bento ── */}
        <section className="relative border-b border-border-subtle">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                Product
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary sm:text-[1.75rem]">
                Built for operators
              </h2>
              <p className="mt-2 text-sm text-text-secondary sm:text-base">
                The core loop that keeps content shipping without losing brand
                control.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={cn(
                      "landing-glass group rounded-2xl p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/30",
                      feature.span,
                    )}
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent/25">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-base font-semibold text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 100%, rgba(108,92,231,0.28), transparent 55%)",
            }}
          />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-24">
            <ProductLogo size="md" href={null} />
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              Ready to run Instagram without losing control?
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-secondary sm:text-base">
              Create a workspace, chat through your brand, and ship your first
              reviewed post.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 shadow-[0_0_40px_rgba(108,92,231,0.4)]",
                )}
              >
                Start free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                )}
              >
                Compare plans
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
