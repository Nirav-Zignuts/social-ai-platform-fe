"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AdminPage,
  DefinitionList,
  EmptyHint,
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
    mutationFn: (reason: string) =>
      adminApi.workspaces.unlock(workspaceId, reason),
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
    return (
      <AdminPage title="Workspace detail">
        <LoadingState />
      </AdminPage>
    );
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
  const profile = data.business_profile;
  const aiConfig = data.ai_configuration;
  const isLocked = workspace.status === "locked_over_limit";
  const ownerHref = `${PORTAL_ROOT}/users/${workspace.owner_id}`;

  return (
    <AdminPage
      title={workspace.name}
      description={workspace.slug}
      backHref={ownerHref}
      backLabel="Back to owner"
      actions={
        <>
          <Button
            variant="outline"
            render={
              <Link
                href={`${PORTAL_ROOT}/workspaces/${workspaceId}/generation-runs`}
              />
            }
          >
            Generation runs
          </Button>
          {isLocked ? (
            <Button onClick={() => setUnlockOpen(true)}>Unlock workspace</Button>
          ) : null}
        </>
      }
    >
      {isLocked ? (
        <div className="rounded-2xl border border-status-rejected/30 bg-status-rejected/10 px-5 py-4">
          <p className="text-base font-medium text-text-primary">
            Workspace locked over plan limit
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Generation and publishing stay blocked until unlocked or the owner
            upgrades.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Overview" description="Workspace settings">
          <DefinitionList
            items={[
              {
                label: "Status",
                value: <StatusPill value={workspace.status} />,
              },
              {
                label: "Onboarding",
                value: <StatusPill value={workspace.onboarding_status} />,
              },
              { label: "Timezone", value: workspace.timezone },
              {
                label: "Preferred post time",
                value: workspace.preferred_post_time ?? "—",
              },
              {
                label: "Generation lead",
                value: `${workspace.generation_lead_hours} hours`,
              },
              {
                label: "Last generation",
                value: formatDate(workspace.last_generation_date),
              },
              {
                label: "Created",
                value: formatDate(workspace.created_at),
              },
            ]}
          />
        </Panel>

        <Panel title="Knowledge base" description="Uploaded documents">
          <p className="text-3xl font-semibold tracking-tight text-text-primary">
            {formatNumber(data.knowledge_documents.count)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">total documents</p>
          {Object.keys(data.knowledge_documents.by_status).length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(data.knowledge_documents.by_status).map(
                ([status, count]) => (
                  <span
                    key={status}
                    className="rounded-full bg-bg-base px-3 py-1.5 text-sm text-text-secondary"
                  >
                    {humanize(status)} · {count}
                  </span>
                ),
              )}
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Business profile">
          {profile ? (
            <DefinitionList
              columns={1}
              items={[
                { label: "Business name", value: str(profile.business_name) },
                { label: "Industry", value: str(profile.industry) },
                {
                  label: "Target audience",
                  value: str(profile.target_audience),
                },
                { label: "Brand voice", value: str(profile.brand_voice) },
                { label: "Website", value: str(profile.website_url) },
                {
                  label: "Description",
                  value: str(profile.description),
                },
              ]}
            />
          ) : (
            <EmptyHint>Business profile not configured.</EmptyHint>
          )}
        </Panel>

        <Panel title="AI configuration">
          {aiConfig ? (
            <DefinitionList
              columns={1}
              items={[
                { label: "Content style", value: str(aiConfig.content_style) },
                {
                  label: "Caption length",
                  value: str(aiConfig.caption_length),
                },
                {
                  label: "Hashtag count",
                  value: str(aiConfig.hashtag_count),
                },
                { label: "Emoji usage", value: str(aiConfig.emoji_usage) },
                { label: "CTA style", value: str(aiConfig.cta_style) },
                {
                  label: "Custom instructions",
                  value: str(aiConfig.custom_instructions),
                },
              ]}
            />
          ) : (
            <EmptyHint>AI configuration not set.</EmptyHint>
          )}
        </Panel>
      </div>

      <Panel
        title="Instagram"
        description={
          data.instagram_connections.length
            ? `${data.instagram_connections.length} connection${data.instagram_connections.length === 1 ? "" : "s"}`
            : "No accounts linked"
        }
      >
        {data.instagram_connections.length ? (
          <ul className="space-y-3">
            {data.instagram_connections.map((connection, index) => (
              <li
                key={String(connection.id ?? index)}
                className="rounded-xl border border-border-subtle bg-bg-base/40 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-text-primary">
                      {str(connection.display_name) !== "—"
                        ? str(connection.display_name)
                        : str(connection.provider_username)}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      @{str(connection.provider_username)}
                    </p>
                  </div>
                  <StatusPill value={String(connection.status ?? "unknown")} />
                </div>
                <p className="mt-3 text-sm text-text-secondary">
                  Connected {formatDate(String(connection.connected_at ?? ""))}
                  {connection.expires_at
                    ? ` · Expires ${formatDate(String(connection.expires_at))}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyHint>Not connected to Instagram.</EmptyHint>
        )}
      </Panel>

      <Panel title="Recent generated posts">
        {data.recent_generated_posts.length ? (
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>Content</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Score</th>
                <th className={thClass}>Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_generated_posts.map((post) => (
                <tr key={post.id}>
                  <td className={tdClass}>
                    {humanize(post.content_type || "post")}
                  </td>
                  <td className={tdClass}>
                    <StatusPill value={post.status} />
                  </td>
                  <td className={tdClass}>{post.reviewer_score ?? "—"}</td>
                  <td className={tdClass}>{formatDate(post.scheduled_for)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyHint>No generated posts yet.</EmptyHint>
        )}
      </Panel>

      <Panel title="Recent publishing jobs">
        {data.recent_publishing_jobs.length ? (
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>Created</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Attempts</th>
                <th className={thClass}>Error</th>
                <th className={thClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_publishing_jobs.map((job) => {
                const failed =
                  job.status.toLowerCase() === "failed" ||
                  job.status.toLowerCase() === "retrying";
                return (
                  <tr key={job.id}>
                    <td className={tdClass}>{formatDate(job.created_at)}</td>
                    <td className={tdClass}>
                      <StatusPill value={job.status} />
                    </td>
                    <td className={tdClass}>{job.attempt_count}</td>
                    <td className={`${tdClass} max-w-xs`}>
                      <p className="line-clamp-2 text-sm text-text-secondary">
                        {job.last_error ?? "—"}
                      </p>
                    </td>
                    <td className={tdClass}>
                      {failed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRetryJobId(job.id)}
                        >
                          Retry
                        </Button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyHint>No publishing jobs yet.</EmptyHint>
        )}
      </Panel>

      <Panel title="Recent AI usage">
        {data.recent_ai_usage.length ? (
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Purpose</th>
                <th className={thClass}>Model</th>
                <th className={thClass}>Tokens</th>
                <th className={thClass}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_ai_usage.map((usage) => (
                <tr key={usage.id}>
                  <td className={tdClass}>{formatDate(usage.created_at)}</td>
                  <td className={tdClass}>
                    {humanize(usage.agent_purpose)}
                  </td>
                  <td className={tdClass}>
                    {usage.provider} / {usage.model}
                  </td>
                  <td className={tdClass}>
                    {formatNumber(usage.total_tokens)}
                  </td>
                  <td className={tdClass}>
                    ${Number(usage.estimated_cost_usd).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <EmptyHint>No AI usage logged for this workspace.</EmptyHint>
        )}
      </Panel>

      <ReasonDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        title="Unlock workspace"
        description="This bypasses the plan limit and activates the workspace. A reason is required."
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

function str(value: unknown) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  return String(value);
}

function notifyError(error: Error) {
  toast.error(
    error instanceof AdminApiError ? error.message : "Admin action failed",
  );
}
