"use client";

import { cn } from "@/lib/utils";

interface ReviewerNotesProps {
  notes: string;
  /** Compact card style vs detail panel */
  variant?: "card" | "panel";
  className?: string;
}

/**
 * Scrollable reviewer notes so long AI feedback stays readable in cards
 * without blowing up layout height.
 */
export function ReviewerNotes({
  notes,
  variant = "card",
  className,
}: ReviewerNotesProps) {
  if (variant === "panel") {
    return (
      <div
        className={cn(
          "rounded-lg border border-status-pending/30 bg-status-pending/10 p-4",
          className,
        )}
      >
        <h3 className="text-sm font-medium text-status-pending">
          Reviewer notes
        </h3>
        <div
          className={cn(
            "mt-2 max-h-48 overflow-y-auto overscroll-contain pr-1",
            "scroll-area text-body text-text-primary",
          )}
          tabIndex={0}
          role="region"
          aria-label="Reviewer notes"
        >
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {notes}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-3 rounded-md border border-border-subtle/60 bg-bg-base",
        className,
      )}
      onClick={(event) => event.preventDefault()}
    >
      <p className="border-b border-border-subtle/40 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        Reviewer notes
      </p>
      <div
        className={cn(
          "max-h-24 overflow-y-auto overscroll-contain px-3 py-2",
          "scroll-area text-caption italic leading-relaxed text-text-secondary",
        )}
        tabIndex={0}
        role="region"
        aria-label="Reviewer notes"
        onClick={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <p className="whitespace-pre-wrap break-words">{notes}</p>
      </div>
    </div>
  );
}
