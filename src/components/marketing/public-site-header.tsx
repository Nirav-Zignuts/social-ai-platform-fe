"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicSiteHeader() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="border-b border-border-subtle bg-bg-base/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-text-primary"
        >
          Social AI
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/pricing"
            className="px-2 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            Pricing
          </Link>
          {!isLoading && isAuthenticated ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden px-2 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary sm:inline"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
