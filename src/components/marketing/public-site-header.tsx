"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ProductLogo } from "@/components/marketing/product-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicSiteHeader() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle/80 bg-bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <ProductLogo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/pricing"
            className="rounded-lg px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary"
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
                className="hidden rounded-lg px-2.5 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-surface-hover hover:text-text-primary sm:inline"
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
