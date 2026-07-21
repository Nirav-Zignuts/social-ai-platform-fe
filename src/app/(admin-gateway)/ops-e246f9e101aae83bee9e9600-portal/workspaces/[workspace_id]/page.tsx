"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Panel,
  PORTAL_ROOT,
  StatusPill,
  TableWrap,
  formatDate,
  formatNumber,
  humanize,
  tdClass,
  thClass,
} from "../../_components/admin-ui";
import { ReasonDialog } from "../../_components/reason-dialog";
import { AdminApiError, adminApi } from "../../_lib/admin-api";

export default function AdminWorkspaceDetailPage() {
  const { workspace_id: workspaceId } = useParams<{ workspace_id: string }>();
  const queryClient = useQueryClient();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [retryJobId, setRetryJobId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["admin", "workspace", workspaceId],
    queryFn: () => adminApi.workspaces.detail(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "workspace", workspaceId],
    });
  const unlock = useMutation({
    mutationFn: (reason: string) => adminApi.workspaces.unlock(workspaceId, reason),
    onSuccess: async () => {
      setUnlockOpen(false);
      await refresh();
      toast.success("Workspace unlocked");
    },
    onError: notifyError,
  });
  const retry = useMutation({
    mutationFn: (reason: string) =>
      adminApi.publishingJobs.retry(retryJobId ?? "", reason),
    onSuccess: async () => {
      setRetryJobId(null);
      await refresh();
      toast.success("Publishing retry queued");
    },
    onError: notifyError,
  });

  if (query.isLoading) {
    return <AdminPage title="Workspace detail"><LoadingState /></AdminPage>;
  }
  if (query.isError || !query.data) {
    return (
      <AdminPage title="Workspace detail">
        <ErrorState retry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const data = query.data;
  const workspace = data.workspace;
  return (
    <AdminPage
      title={workspace.name}
      description={`${workspace.slug} · ${workspace.id}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`${PORTAL_ROOT}/workspaces/${workspaceId}/generation-runs`} />}>
            Generation runs
          </Button>
          {workspace.status === "locked" ? (
            <Button onClick={() => setUnlockOpen(true)}>Unlock workspace</Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Workspace profile">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Status"><StatusPill value={workspace.status} /></Field>
            <Field label="Onboarding"><StatusPill value={workspace.onboarding_status} /></Field>
            <Field label="Owner ID">{workspace.owner_id}</Field>
            <Field label="Timezone">{workspace.timezone}</Field>
            <Field label="Preferred post time">{workspace.preferred_post_time ?? "—"}</Field>
            <Field label="Generation lead">{workspace.generation_lead_hours} hours</Field>
            <Field label="Last generation">{formatDate(workspace.last_generation_date)}</Field>
            <Field label="Created">{formatDate(workspace.created_at)}</Field>
          </dl>
        </Panel>
        <Panel title="Knowledge base">
          <p className="text-2xl font-semibold">{formatNumber(data.knowledge_documents.count)}</p>
          <p className="text-xs text-text-secondary">documents</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(data.knowledge_documents.by_status).map(([status, count]) => (
              <span key={status} className="rounded-lg bg-bg-surface-hover px-3 py-2 text-xs">
                {humanize(status)}: {count}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ObjectPanel title="Business profile" value={data.business_profile} />
        <ObjectPanel title="AI configuration" value={data.ai_configuration} />
      </div>

      <Panel title={`Instagram connections (${data.instagram_connections.length})`}>
        <div className="grid gap-3 md:grid-cols-2">
          {data.instagram_connections.map((connection, index) => (
            <div key={String(connection.id ?? index)} className="rounded-lg border border-border-subtle p-4">
              <ObjectGrid value={connection} />
            </div>
          ))}
          {!data.instagram_connections.length ? (
            <p className="text-sm text-text-secondary">No Instagram connections.</p>
          ) : null}
        </div>
      </Panel>

      <Panel title="Recent generated posts">
        <TableWrap>
          <thead><tr>
            <th className={thClass}>Post</th><th className={thClass}>Status</th>
            <th className={thClass}>Score</th><th className={thClass}>Scheduled</th>
          </tr></thead>
          <tbody>
            {data.recent_generated_posts.map((post) => (
              <tr key={post.id}>
                <td className={tdClass}>
                  <p>{humanize(post.content_type)}</p>
                  <p className="text-xs text-text-secondary">{post.id}</p>
                </td>
                <td className={tdClass}><StatusPill value={post.status} /></td>
                <td className={tdClass}>{post.reviewer_score ?? "—"}</td>
                <td className={tdClass}>{formatDate(post.scheduled_for)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title="Recent publishing jobs">
        <TableWrap>
          <thead><tr>
            <th className={thClass}>Job</th><th className={thClass}>Status</th>
            <th className={thClass}>Attempts</th><th className={thClass}>Error</th>
            <th className={thClass}>Action</th>
          </tr></thead>
          <tbody>
            {data.recent_publishing_jobs.map((job) => (
              <tr key={job.id}>
                <td className={tdClass}>
                  <p className="text-xs">{job.id}</p>
                  <p className="text-xs text-text-secondary">{formatDate(job.created_at)}</p>
                </td>
                <td className={tdClass}><StatusPill value={job.status} /></td>
                <td className={tdClass}>{job.attempt_count}</td>
                <td className={`${tdClass} max-w-80`}>
                  <p className="line-clamp-3 text-xs text-status-rejected">{job.last_error ?? "—"}</p>
                </td>
                <td className={tdClass}>
                  {job.status === "failed" || job.status === "retrying" ? (
                    <Button size="sm" variant="outline" onClick={() => setRetryJobId(job.id)}>
                      Retry
                    </Button>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title="Recent AI usage">
        <TableWrap>
          <thead><tr>
            <th className={thClass}>Time</th><th className={thClass}>Purpose</th>
            <th className={thClass}>Provider / model</th><th className={thClass}>Tokens</th>
            <th className={thClass}>Cost</th>
          </tr></thead>
          <tbody>
            {data.recent_ai_usage.map((usage) => (
              <tr key={usage.id}>
                <td className={tdClass}>{formatDate(usage.created_at)}</td>
                <td className={tdClass}>{usage.agent_purpose}</td>
                <td className={tdClass}>{usage.provider} / {usage.model}</td>
                <td className={tdClass}>{formatNumber(usage.total_tokens)}</td>
                <td className={tdClass}>${Number(usage.estimated_cost_usd).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <ReasonDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        title="Unlock workspace"
        description="This bypasses the plan limit and activates the workspace."
        confirmLabel="Unlock"
        pending={unlock.isPending}
        onConfirm={(reason) => unlock.mutate(reason)}
      />
      <ReasonDialog
        open={Boolean(retryJobId)}
        onOpenChange={(open) => !open && setRetryJobId(null)}
        title="Retry publishing job"
        description="The post will be approved and queued for another publishing attempt."
        confirmLabel="Queue retry"
        pending={retry.isPending}
        onConfirm={(reason) => retry.mutate(reason)}
      />
    </AdminPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 break-words">{children}</dd></div>;
}

function ObjectPanel({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return <Panel title={title}>{value ? <ObjectGrid value={value} /> : <p className="text-sm text-text-secondary">Not configured.</p>}</Panel>;
}

function ObjectGrid({ value }: { value: Record<string, unknown> }) {
  return (
    <dl className="grid grid-cols-2 gap-4 text-sm">
      {Object.entries(value).map(([key, item]) => (
        <Field key={key} label={humanize(key)}>
          {Array.isArray(item) ? item.join(", ") || "—" : item == null ? "—" : String(item)}
        </Field>
      ))}
    </dl>
  );
}

function notifyError(error: Error) {
  toast.error(error instanceof AdminApiError ? error.message : "Admin action failed");
}
