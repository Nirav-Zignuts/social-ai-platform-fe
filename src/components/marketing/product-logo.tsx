import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductLogoProps {
  className?: string;
  /** Show wordmark next to the mark */
  withWordmark?: boolean;
  href?: string | null;
  size?: "sm" | "md";
}

/**
 * Mark: abstract “signal / content burst” — three ascending bars
 * capped by a soft glow node, reading as AI-driven social output.
 */
export function ProductLogo({
  className,
  withWordmark = true,
  href = "/",
  size = "sm",
}: ProductLogoProps) {
  const markSize = size === "md" ? "size-9" : "size-7";
  const wordSize = size === "md" ? "text-base" : "text-sm";

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-text-primary",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-[#4A3DB8] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_8px_20px_rgba(108,92,231,0.35)]",
          markSize,
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(size === "md" ? "size-5" : "size-4")}
        >
          <path
            d="M6 16.5V14"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M12 16.5V10"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M18 16.5V7"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="18" cy="5.2" r="1.6" fill="white" fillOpacity="0.95" />
        </svg>
      </span>
      {withWordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight",
            wordSize,
          )}
        >
          Social AI
        </span>
      )}
    </span>
  );

  if (href == null) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}
