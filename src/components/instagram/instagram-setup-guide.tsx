"use client";

import { useId, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REQUIREMENTS = [
  "Instagram Professional account (Business or Creator)",
  "A Facebook Page",
  "Your Instagram account is linked to that Facebook Page",
  "You have full admin access to the Facebook Page",
] as const;

const LINK_STEPS = [
  {
    title: "Open Instagram profile settings",
    detail: "Go to Profile → Edit Profile.",
  },
  {
    title: "Find the Page option",
    detail: "Tap Page (or Business Information → Page).",
  },
  {
    title: "Select or create a Facebook Page",
    detail: "Choose an existing Page, or create one if you don’t have one yet.",
  },
  {
    title: "Approve Facebook access",
    detail: "If prompted, log in to Facebook and grant the requested permissions.",
  },
  {
    title: "Return here to connect",
    detail: "Come back to this page and click Connect Instagram.",
  },
] as const;

interface InstagramSetupGuideProps {
  /** Expanded by default when the account is not connected. */
  defaultOpen?: boolean;
  className?: string;
}

export function InstagramSetupGuide({
  defaultOpen = false,
  className,
}: InstagramSetupGuideProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border-subtle bg-bg-surface",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-bg-surface-hover"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-surface-hover text-accent">
          {open ? (
            <BookOpen className="size-4" />
          ) : (
            <CircleHelp className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-text-primary">
            Setup guide
          </span>
          <span className="mt-0.5 block text-caption">
            {defaultOpen
              ? "Complete these steps before connecting"
              : "How to link Instagram to a Facebook Page"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-text-secondary transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-border-subtle"
      >
        <div className="space-y-8 px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm leading-relaxed text-text-secondary">
              Before connecting, make sure your Instagram account is properly
              linked to Facebook. Meta only allows Business/Creator accounts
              that are connected to a Facebook Page.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Requirements
            </h3>
            <ul className="mt-3 space-y-2.5">
              {REQUIREMENTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-text-primary"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-status-approved/15 text-status-approved">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              How to link your Instagram account
            </h3>
            <ol className="mt-3 space-y-3">
              {LINK_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-surface-hover text-[11px] font-semibold tabular-nums text-text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-text-primary">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-border-subtle bg-bg-base/60 px-4 py-3.5">
            <p className="text-sm font-medium text-text-primary">
              Don&apos;t have a Facebook Page?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Create one first, then link it to your Instagram Professional
              account before connecting here.
            </p>
            <a
              href="https://www.facebook.com/pages/create"
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-hover"
            >
              Create a Facebook Page
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
