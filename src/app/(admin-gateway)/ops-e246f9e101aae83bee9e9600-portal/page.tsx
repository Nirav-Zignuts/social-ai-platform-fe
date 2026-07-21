"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, Coins, MessagesSquare } from "lucide-react";
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Panel,
  PORTAL_ROOT,
  StatusPill,
  formatDate,
  formatNumber,
} from "./_components/admin-ui";
import { adminApi } from "./_lib/admin-api";

export default function AdminDashboardPage() {
  const summary = useQuery({
    queryKey: ["admin", "usage-summary", "30d"],
    queryFn: () => adminApi.usage.summary("30d"),
  });
  const logs = useQuery({
    queryKey: ["admin", "action-logs", "recent"],
    queryFn: () =>
      adminApi.actionLogs.list({ limit: 5, offset: 0 }),
  });
  const enquiries = useQuery({
    queryKey: ["admin", "enquiries", "recent-new"],
    queryFn: () =>
      adminApi.enquiries.list({
        status: "new",
        sort_order: "desc",
        limit: 5,
        offset: 0,
      }),
  });

  const queries = [summary, logs, enquiries];
  const loading = queries.some((query) => query.isLoading);
  const failed = queries.some((query) => query.isError);

  return (
    <AdminPage
      title="Operations dashboard"
      description="Platform activity and support health at a glance"
    >
      {loading ? (
        <LoadingState />
      ) : failed ? (
        <ErrorState
          retry={() => queries.forEach((query) => void query.refetch())}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              icon={<Activity className="size-5 text-accent" />}
              label="Tokens · 30 days"
              value={formatNumber(summary.data?.totals.total_tokens)}
            />
            <Metric
              icon={<Coins className="size-5 text-status-approved" />}
              label="Estimated cost · 30 days"
              value={`$${Number(summary.data?.totals.estimated_cost_usd ?? 0).toFixed(4)}`}
            />
            <Metric
              icon={<MessagesSquare className="size-5 text-status-pending" />}
              label="New enquiries"
              value={formatNumber(enquiries.data?.total)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Provider breakdown">
              <div className="space-y-3">
                {summary.data?.by_provider.map((provider) => (
                  <div
                    key={provider.provider}
                    className="flex items-center justify-between gap-4 border-b border-border-subtle pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{provider.provider}</p>
                      <p className="text-xs text-text-secondary">
                        {formatNumber(provider.calls)} calls
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{formatNumber(provider.total_tokens)} tokens</p>
                      <p className="text-xs text-text-secondary">
                        ${Number(provider.estimated_cost_usd).toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
                {!summary.data?.by_provider.length ? (
                  <p className="text-sm text-text-secondary">No usage recorded.</p>
                ) : null}
              </div>
              <Link
                className="mt-4 inline-block text-sm text-accent hover:underline"
                href={`${PORTAL_ROOT}/ai-usage`}
              >
                View all usage
              </Link>
            </Panel>

            <Panel title="Recent admin actions">
              <div className="space-y-3">
                {logs.data?.items.map((log) => (
                  <div key={log.id} className="border-b border-border-subtle pb-3 last:border-0">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{log.action_type}</span>
                      <span className="text-xs text-text-secondary">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                      {log.reason}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                className="mt-4 inline-block text-sm text-accent hover:underline"
                href={`${PORTAL_ROOT}/action-logs`}
              >
                View action log
              </Link>
            </Panel>
          </div>

          <Panel title="Recent new contact enquiries">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {enquiries.data?.items.map((enquiry) => (
                <Link
                  key={enquiry.id}
                  href={`${PORTAL_ROOT}/contact-enquiries`}
                  className="rounded-lg border border-border-subtle p-4 transition-colors hover:bg-bg-surface-hover"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{enquiry.name}</p>
                    <StatusPill value={enquiry.status} />
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">{enquiry.email}</p>
                  <p className="mt-3 line-clamp-2 text-sm">{enquiry.message}</p>
                </Link>
              ))}
            </div>
          </Panel>
        </>
      )}
    </AdminPage>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
