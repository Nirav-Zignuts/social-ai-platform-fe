"use client";

import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Copy left, phone pushed to the right edge — cross-laid product shot.
 */
export function PhoneShowcaseSection() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(45% 80% at 92% 55%, rgba(108,92,231,0.22), transparent 60%),
            radial-gradient(30% 50% at 10% 80%, rgba(77,184,138,0.08), transparent 55%),
            linear-gradient(180deg, #0B0C0E 0%, #12141C 100%)
          `,
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="relative z-10 max-w-md lg:pr-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Live on Instagram
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary sm:text-[1.65rem]">
            Drafts become posts — still under your approval
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Social AI prepares on-brand content; you review, then it lands in
            the feed. Same loop from chat setup to a published Instagram post.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-text-secondary">
            {[
              "Human approval before anything goes live",
              "On-brand captions grounded in your knowledge base",
              "Scheduled publish without manual posting busywork",
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "default" }), "mt-8")}
          >
            See it in your workspace
          </Link>
        </div>

        {/* Phone anchored to the right — overflows slightly for product drama */}
        <div
          className="relative -mr-4 flex min-h-[320px] items-end justify-end sm:-mr-6 sm:min-h-[380px] lg:-mr-10 lg:min-h-[420px]"
          style={{ perspective: "1100px" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[6%] right-[8%] h-14 w-[55%] rounded-[100%] bg-black/55 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-[12%] right-[16%] h-8 w-[35%] rounded-[100%] bg-accent/25 blur-xl"
          />

          <div
            className="absolute bottom-28 -right-20  w-[min(100%,340px)] origin-bottom-right sm:w-[min(100%,400px)] lg:w-[440px] lg:translate-x-6"
            style={{
              transform: "rotateX(42deg) rotateZ(-22deg) translateY(8px)",
              transformStyle: "preserve-3d",
            }}
          >
            <Image
              src="/marketing/landing-iphone-cutout-v4.png"
              alt="iPhone showing an Instagram post published with Social AI"
              width={637}
              height={832}
              className="relative h-auto w-full select-none drop-shadow-[0_30px_60px_rgba(0,0,0,0.65)]"
              sizes="(max-width: 1024px) 60vw, 440px"
              priority
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
}
