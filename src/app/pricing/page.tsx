import Link from "next/link";
import { PricingCards } from "@/components/billing/pricing-cards";
import { PRICING_FAQ } from "@/lib/plans";
import { PublicSiteFooter } from "@/components/marketing/public-site-footer";
import { PublicSiteHeader } from "@/components/marketing/public-site-header";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent">Pricing</p>
          <h1 className="mt-2 text-page-title sm:text-display">
            Simple plans for growing social teams
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Start free with two workspaces. Upgrade when you need more brands,
            accounts, and support.
          </p>
        </div>

        <div className="mt-12">
          <PricingCards />
        </div>

        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-section-header">FAQ</h2>
          <div className="mt-8 divide-y divide-border-subtle border-y border-border-subtle">
            {PRICING_FAQ.map((item) => (
              <div key={item.question} className="py-5">
                <h3 className="text-sm font-medium text-text-primary">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-caption">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
