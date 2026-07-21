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
  const [plan, setSelectedPlan] = useState("free");
  const [status, setStatus] = useState("active");

  const query = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminApi.users.detail(userId),
    enabled: Boolean(userId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });

  const planMutation = useMutation({
    mutationFn: (reason: string) => adminApi.users.setPlan(userId, plan, reason),
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
    return <AdminPage title="User detail"><LoadingState /></AdminPage>;
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
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPlanOpen(true)}>
            Change plan
          </Button>
          <Button
            variant="outline"
            disabled={!subscription}
            onClick={() => setStatusOpen(true)}
          >
            Force status
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Account information">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Status"><StatusPill value={user.status} /></Field>
            <Field label="User ID">{user.id}</Field>
            <Field label="Email verified">{formatDate(user.email_verified_at)}</Field>
            <Field label="Last login">{formatDate(user.last_login_at)}</Field>
            <Field label="Created">{formatDate(user.created_at)}</Field>
          </dl>
        </Panel>

        <Panel title="Subscription">
          {subscription ? (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Plan">{subscription.plan_name} ({subscription.plan_key})</Field>
              <Field label="Status"><StatusPill value={subscription.status} /></Field>
              <Field label="Workspace limit">{subscription.workspace_limit}</Field>
              <Field label="Period end">{formatDate(subscription.current_period_end)}</Field>
              <Field label="Cancel at period end">
                {subscription.cancel_at_period_end ? "Yes" : "No"}
              </Field>
              <Field label="Razorpay ID">
                {subscription.razorpay_subscription_id ?? "—"}
              </Field>
            </dl>
          ) : (
            <p className="text-sm text-text-secondary">No subscription exists.</p>
          )}
        </Panel>
      </div>

      <Panel title={`Workspaces (${workspaces.length})`}>
        <div className="grid gap-3 md:grid-cols-2">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`${PORTAL_ROOT}/workspaces/${workspace.id}`}
              className="rounded-lg border border-border-subtle p-4 hover:bg-bg-surface-hover"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-accent">{workspace.name}</span>
                <StatusPill value={workspace.status} />
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                {workspace.timezone} · {workspace.onboarding_status}
              </p>
            </Link>
          ))}
          {!workspaces.length ? (
            <p className="text-sm text-text-secondary">No workspaces.</p>
          ) : null}
        </div>
      </Panel>

      <ReasonDialog
        open={planOpen}
        onOpenChange={setPlanOpen}
        title="Change user plan"
        description="This overrides billing and synchronizes workspace entitlements."
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
        description="Use only when the billing provider state must be overridden."
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
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
    <label className="space-y-2 text-sm">
      <span>{label}</span>
      <select
        className="h-9 w-full rounded-lg border border-border-subtle bg-bg-base px-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
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
