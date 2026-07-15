"use client";

import Link from "next/link";

export function PublicSiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-text-secondary">
          © {year} Social AI
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
          <Link
            href="/pricing"
            className="transition-colors hover:text-text-primary"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-text-primary"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="transition-colors hover:text-text-primary"
          >
            Get started
          </Link>
        </nav>
      </div>
    </footer>
  );
}
