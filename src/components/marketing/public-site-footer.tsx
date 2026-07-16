"use client";

import Link from "next/link";
import { ProductLogo } from "@/components/marketing/product-logo";

const FOOTER_LINKS = {
  Product: [
    { href: "/pricing", label: "Pricing" },
    { href: "/register", label: "Get started" },
    { href: "/login", label: "Sign in" },
  ],
  Company: [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Plans" },
  ],
} as const;

export function PublicSiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-border-subtle bg-bg-surface/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <ProductLogo size="md" />
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              AI-assisted Instagram content with human approval built in —
              generate, review, and schedule without losing brand control.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-secondary">
                {heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-primary/80 transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption">
            © {year} Social AI. All rights reserved.
          </p>
          <p className="text-caption">Built for operators who stay in the loop.</p>
        </div>
      </div>
    </footer>
  );
}
