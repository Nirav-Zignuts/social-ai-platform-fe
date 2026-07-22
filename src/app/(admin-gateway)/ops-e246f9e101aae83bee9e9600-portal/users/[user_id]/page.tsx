"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
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
  formatDate,
} from "../../_components/admin-ui";
import { ReasonDialog } from "../../_components/reason-dialog";
import { AdminApiError, adminApi } from "../../_lib/admin-api";

const planOptions = ["free", "pro", "business"];
const statusOptions = ["pending", "active", "past_due", "cancelled", "expired"];

export default function AdminUserDetailPage() {
  const { user_id: userId } = useParams<{ user_id: string }>();
  const queryClient = useQueryClient();
  const [planOpen, setPlanOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [plan, setSelectedPlan] = useState("pro");
  const [status, setStatus] = useState("active");

  const query = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminApi.users.detail(userId),
    enabled: Boolean(userId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });

  const planMutation = useMutation({
    mutationFn: (reason: string) =>
      adminApi.users.setPlan(userId, plan, reason),
    onSuccess: async () => {
      setPlanOpen(false);
      await refresh();
      toast.success("Plan changed");
    },
    onError: notifyError,
  });

  const forceStatus = useMutation({
    mutationFn: (reason: string) =>
      adminApi.subscriptions.forceStatus(
        query.data?.subscription?.id ?? "",
        status,
        reason,
      ),
    onSuccess: async () => {
      setStatusOpen(false);
      await refresh();
      toast.success("Subscription status updated");
    },
    onError: notifyError,
  });

  if (query.isLoading) {
    return (
      <AdminPage title="User detail">
        <LoadingState />
      </AdminPage>
    );
  }
  if (query.isError || !query.data) {
    return (
      <AdminPage title="User detail">
        <ErrorState retry={() => void query.refetch()} />
      </AdminPage>
    );
  }

  const { user, subscription, workspaces } = query.data;

  return (
    <AdminPage
      title={user.full_name || user.email}
      description={user.email}
      backHref={`${PORTAL_ROOT}/users`}
      backLabel="Back to users"
      actions={
        <>
          <Button onClick={() => setPlanOpen(true)}>Change plan</Button>
          <Button
            variant="outline"
            disabled={!subscription}
            onClick={() => setStatusOpen(true)}
          >
            Force status
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Account" description="Identity and activity">
          <DefinitionList
            items={[
              {
                label: "Status",
                value: <StatusPill value={user.status} />,
              },
              {
                label: "Signed up",
                value: formatDate(user.created_at),
              },
              {
                label: "Email verified",
                value: formatDate(user.email_verified_at),
              },
              {
                label: "Last login",
                value: formatDate(user.last_login_at),
              },
            ]}
          />
        </Panel>

        <Panel
          title="Subscription"
          description="Current billing entitlement"
          actions={
            subscription ? (
              <StatusPill value={subscription.status} />
            ) : undefined
          }
        >
          {subscription ? (
            <DefinitionList
              items={[
                {
                  label: "Plan",
                  value: (
                    <span className="font-medium">
                      {subscription.plan_name}
                      <span className="ml-2 text-sm font-normal text-text-secondary">
                        ({subscription.plan_key})
                      </span>
                    </span>
                  ),
                },
                {
                  label: "Workspace limit",
                  value:
                    subscription.workspace_limit == null
                      ? "Unlimited"
                      : String(subscription.workspace_limit),
                },
                {
                  label: "Period ends",
                  value: formatDate(subscription.current_period_end),
                },
                {
                  label: "Cancels at period end",
                  value: subscription.cancel_at_period_end ? "Yes" : "No",
                },
              ]}
            />
          ) : (
            <EmptyHint>No subscription on this account yet.</EmptyHint>
          )}
        </Panel>
      </div>

      <Panel
        title="Workspaces"
        description={`${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"} owned by this user`}
      >
        {workspaces.length ? (
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle">
            {workspaces.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`${PORTAL_ROOT}/workspaces/${workspace.id}`}
                  className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-bg-surface-hover/60 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-text-primary">
                      {workspace.name}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Onboarding: {workspace.onboarding_status.replaceAll("_", " ")}
                      {" · "}
                      {workspace.timezone}
                    </p>
                  </div>
                  <StatusPill value={workspace.status} />
                  <ChevronRight className="size-4 shrink-0 text-text-secondary" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyHint>This user has no workspaces.</EmptyHint>
        )}
      </Panel>

      <ReasonDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        title="Change user plan"
        description="This overrides billing and synchronizes workspace entitlements. A reason is required for the audit log."
        confirmLabel="Confirm plan change"
        pending={planMutation.isPending}
        onConfirm={(reason) => planMutation.mutate(reason)}
        extra={
          <SelectField
            label="Plan"
            value={plan}
            options={planOptions}
            onChange={setSelectedPlan}
          />
        }
      />
      <ReasonDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        title="Force subscription status"
        description="Emergency billing override. Use only when the provider state must be corrected manually."
        confirmLabel="Force status"
        pending={forceStatus.isPending}
        onConfirm={(reason) => forceStatus.mutate(reason)}
        extra={
          <SelectField
            label="Status"
            value={status}
            options={statusOptions}
            onChange={setStatus}
          />
        }
      />
    </AdminPage>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-base">
      <span className="font-medium text-text-primary">{label}</span>
      <select
        className="flex h-10 w-full rounded-lg border border-border-subtle bg-bg-base px-3 text-base text-text-primary outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function notifyError(error: Error) {
  toast.error(
    error instanceof AdminApiError ? error.message : "Admin action failed",
  );
}
