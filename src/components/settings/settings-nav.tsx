"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_TABS = [
  { href: "", label: "General" },
  { href: "/business-profile", label: "Business Profile" },
  { href: "/ai-configuration", label: "AI Configuration" },
  { href: "/knowledge-base", label: "Knowledge Base" },
  { href: "/instagram", label: "Instagram" },
];

interface SettingsNavProps {
  workspaceId: string;
}

export function SettingsNav({ workspaceId }: SettingsNavProps) {
  const pathname = usePathname();
  const basePath = `/workspaces/${workspaceId}/settings`;

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border-subtle">
      {SETTINGS_TABS.map((tab) => {
        const href = `${basePath}${tab.href}`;
        const isActive =
          tab.href === ""
            ? pathname === basePath
            : pathname.startsWith(href);

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm transition-colors duration-150",
              isActive
                ? "border-accent font-medium text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
