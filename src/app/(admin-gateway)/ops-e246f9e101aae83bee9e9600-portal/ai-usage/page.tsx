"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Pagination,
  TableWrap,
  formatDate,
  formatNumber,
  tdClass,
  thClass,
} from "../_components/admin-ui";
import { adminApi } from "../_lib/admin-api";

const LIMIT = 50;

export default function AdminAiUsagePage() {
  const [period, setPeriod] = useState<"7d" | "30d">("30d");
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState({
    workspace_id: "",
    agent_purpose: "",
    provider: "",
    from_date: "",
    to_date: "",
  });
  const update = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setOffset(0);
  };
  const list = useQuery({
    queryKey: ["admin", "ai-usage", filters, offset],
    queryFn: () =>
      adminApi.usage.list({
        workspace_id: filters.workspace_id,
        agent_purpose: filters.agent_purpose,
        provider: filters.provider,
        from_date: filters.from_date
          ? `${filters.from_date}T00:00:00Z`
          : undefined,
        to_date: filters.to_date ? `${filters.to_date}T23:59:59Z` : undefined,
        limit: LIMIT,
        offset,
      }),
  });
  const summary = useQuery({
    queryKey: ["admin", "usage-summary", period],
    queryFn: () => adminApi.usage.summary(period),
  });

  return (
    <AdminPage
      title="AI usage"
      description="Token consumption, cost, latency, provider, and purpose"
      actions={
        <select
          className="h-9 rounded-lg border border-border-subtle bg-bg-base px-3"
          value={period}
          onChange={(event) => setPeriod(event.target.value as "7d" | "30d")}
        >
          <option value="7d">Summary: 7 days</option>
          <option value="30d">Summary: 30 days</option>
        </select>
      }
    >
      {summary.isLoading ? (
        <LoadingState />
      ) : summary.isError ? (
        <ErrorState retry={() => void summary.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Calls" value={formatNumber(summary.data?.totals.calls)} />
            <Metric label="Total tokens" value={formatNumber(summary.data?.totals.total_tokens)} />
            <Metric label="Prompt tokens" value={formatNumber(summary.data?.totals.prompt_tokens)} />
            <Metric label="Estimated cost" value={`$${Number(summary.data?.totals.estimated_cost_usd ?? 0).toFixed(4)}`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Breakdown
              title="By provider"
              rows={(summary.data?.by_provider ?? []).map((row) => ({
                name: row.provider,
                calls: row.calls,
                tokens: row.total_tokens,
                cost: row.estimated_cost_usd,
              }))}
            />
            <Breakdown
              title="By agent purpose"
              rows={(summary.data?.by_agent_purpose ?? []).map((row) => ({
                name: row.agent_purpose,
                calls: row.calls,
                tokens: row.total_tokens,
                cost: row.estimated_cost_usd,
              }))}
            />
          </div>
        </>
      )}

      <div className="grid gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 md:grid-cols-2 xl:grid-cols-5">
        <Input placeholder="Workspace ID" value={filters.workspace_id} onChange={(e) => update("workspace_id", e.target.value)} />
        <Input placeholder="Agent purpose" value={filters.agent_purpose} onChange={(e) => update("agent_purpose", e.target.value)} />
        <Input placeholder="Provider" value={filters.provider} onChange={(e) => update("provider", e.target.value)} />
        <Input aria-label="From date" type="date" value={filters.from_date} onChange={(e) => update("from_date", e.target.value)} />
        <Input aria-label="To date" type="date" value={filters.to_date} onChange={(e) => update("to_date", e.target.value)} />
      </div>

      {list.isLoading ? (
        <LoadingState />
      ) : list.isError ? (
        <ErrorState retry={() => void list.refetch()} />
      ) : (
        <>
          <TableWrap>
            <thead><tr>
              <th className={thClass}>Time</th><th className={thClass}>Workspace</th>
              <th className={thClass}>Purpose</th><th className={thClass}>Provider / model</th>
              <th className={thClass}>Prompt</th><th className={thClass}>Completion</th>
              <th className={thClass}>Total</th><th className={thClass}>Cost</th>
              <th className={thClass}>Latency</th>
            </tr></thead>
            <tbody>
              {list.data?.items.map((item) => (
                <tr key={item.id}>
                  <td className={tdClass}>{formatDate(item.created_at)}</td>
                  <td className={`${tdClass} text-xs`}>{item.workspace_id}</td>
                  <td className={tdClass}>{item.agent_purpose}</td>
                  <td className={tdClass}>{item.provider} / {item.model}</td>
                  <td className={tdClass}>{formatNumber(item.prompt_tokens)}</td>
                  <td className={tdClass}>{formatNumber(item.completion_tokens)}</td>
                  <td className={tdClass}>{formatNumber(item.total_tokens)}</td>
                  <td className={tdClass}>${Number(item.estimated_cost_usd).toFixed(4)}</td>
                  <td className={tdClass}>{item.latency_ms == null ? "—" : `${item.latency_ms} ms`}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination offset={offset} limit={LIMIT} total={list.data?.total ?? 0} onChange={setOffset} />
        </>
      )}
    </AdminPage>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border-subtle bg-bg-surface p-5"><p className="text-xs text-text-secondary">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>;
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ name: string; calls: number; tokens: number; cost: number }> }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
      <h2 className="font-medium">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.name} className="flex justify-between gap-4 border-b border-border-subtle pb-2 last:border-0">
            <span>{row.name}</span>
            <span className="text-right text-xs text-text-secondary">{formatNumber(row.tokens)} tokens · {formatNumber(row.calls)} calls · ${Number(row.cost).toFixed(4)}</span>
          </div>
        ))}
        {!rows.length ? <p className="text-sm text-text-secondary">No usage.</p> : null}
      </div>
    </div>
  );
}
