"use client";

import { Check } from "lucide-react";
import { ONBOARDING_STEPS } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

interface OnboardingStepperProps {
  currentStep: number;
}

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  const progress =
    ONBOARDING_STEPS.length <= 1
      ? 100
      : (currentStep / (ONBOARDING_STEPS.length - 1)) * 100;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">
            Setup
          </p>
          <p className="mt-1 text-sm text-text-primary">
            Step {Math.min(currentStep + 1, ONBOARDING_STEPS.length)} of{" "}
            {ONBOARDING_STEPS.length}
          </p>
        </div>
        <p className="text-caption tabular-nums">
          {Math.round(progress)}% complete
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-bg-base">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(progress, currentStep === 0 ? 8 : 0)}%` }}
        />
      </div>

      {/* Desktop / tablet connected stepper */}
      <ol className="hidden gap-2 md:grid md:grid-cols-6">
        {ONBOARDING_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={step.id} className="relative min-w-0">
              {index < ONBOARDING_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[calc(50%+18px)] right-[-50%] top-5 h-px",
                    isComplete ? "bg-accent/70" : "bg-border-subtle",
                  )}
                />
              )}
              <div className="relative flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border transition-colors duration-200",
                    isComplete &&
                      "border-accent bg-accent text-white shadow-[0_0_0_4px_rgba(108,92,231,0.12)]",
                    isCurrent &&
                      "border-accent bg-bg-surface text-accent shadow-[0_0_0_4px_rgba(108,92,231,0.18)]",
                    !isComplete &&
                      !isCurrent &&
                      "border-border-subtle bg-bg-base text-text-secondary",
                  )}
                >
                  {isComplete ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                <p
                  className={cn(
                    "mt-3 text-xs font-medium",
                    isCurrent || isComplete
                      ? "text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  {step.title}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Mobile compact step pill */}
      <div className="rounded-xl border border-border-subtle bg-bg-base/60 p-4 md:hidden">
        <div className="flex items-center gap-3">
          {(() => {
            const step = ONBOARDING_STEPS[currentStep] ?? ONBOARDING_STEPS[0];
            const Icon = step.icon;
            return (
              <>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-caption">{step.hint}</p>
                </div>
              </>
            );
          })()}
        </div>
        <div className="mt-4 flex gap-1.5">
          {ONBOARDING_STEPS.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-200",
                index <= currentStep ? "bg-accent" : "bg-border-subtle",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
