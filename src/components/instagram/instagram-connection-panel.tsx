"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useConnectInstagram } from "@/hooks/use-connect-instagram";
import type { ConnectedAccount, InstagramAccountMetrics } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InstagramSetupGuide } from "@/components/instagram/instagram-setup-guide";
import {
  InstagramProfileAvatar,
  formatMetricCount,
} from "@/components/shared/post-insights-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function tokenExpiryLabel(expiresAt: string | null) {
  if (!expiresAt) return { label: "No expiry on file", tone: "muted" as const };
  const date = new Date(expiresAt);
  const msLeft = date.getTime() - Date.now();
  if (Number.isNaN(msLeft)) {
    return { label: "Unknown", tone: "muted" as const };
  }
  if (msLeft <= 0) {
    return { label: "Expired — reconnect required", tone: "danger" as const };
  }
  if (msLeft < 1000 * 60 * 60 * 24 * 14) {
    return {
      label: `Expires ${formatDistanceToNow(date, { addSuffix: true })}`,
      tone: "warn" as const,
    };
  }
  return {
    label: `Valid until ${format(date, "MMM d, yyyy")}`,
    tone: "ok" as const,
  };
}

function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "warn" | "danger" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "ok" && "bg-status-approved/15 text-status-approved",
        tone === "warn" && "bg-status-pending/15 text-status-pending",
        tone === "danger" && "bg-status-rejected/15 text-status-rejected",
        tone === "muted" && "bg-bg-surface-hover text-text-secondary",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "ok" && "bg-status-approved",
          tone === "warn" && "bg-status-pending",
          tone === "danger" && "bg-status-rejected",
          tone === "muted" && "bg-text-secondary",
        )}
      />
      {children}
    </span>
  );
}

function ConnectedAccountCard({
  account,
  metrics,
  onReconnect,
  isReconnecting,
  onDisconnect,
  isDisconnecting,
}: {
  account: ConnectedAccount;
  metrics: InstagramAccountMetrics | null;
  onReconnect: () => void;
  isReconnecting: boolean;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  const display =
    metrics?.name ||
    account.display_name ||
    metrics?.username ||
    account.provider_username ||
    "Instagram account";
  const handle = metrics?.username || account.provider_username;
  const username = handle ? `@${handle}` : null;
  const profileUrl = handle ? `https://instagram.com/${handle}` : null;
  const expiry = tokenExpiryLabel(account.expires_at);
  const statusTone =
    account.status === "connected"
      ? expiry.tone === "danger"
        ? "danger"
        : "ok"
      : account.status === "error"
        ? "danger"
        : "muted";

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="relative border-b border-border-subtle px-6 py-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(225,48,108,0.18), transparent 55%), radial-gradient(90% 70% at 100% 0%, rgba(131,58,180,0.16), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <InstagramProfileAvatar
              src={metrics?.profile_picture_url}
              name={display}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-medium text-text-primary">
                  {display}
                </h2>
                <StatusPill tone={statusTone}>
                  {account.status === "connected" ? "Connected" : account.status}
                </StatusPill>
              </div>
              {username && profileUrl && (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                  {username}
                  <ExternalLink className="size-3.5 opacity-70" />
                </a>
              )}
              {metrics?.biography && (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                  {metrics.biography}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onReconnect}
              disabled={isReconnecting || isDisconnecting}
              className="gap-2"
            >
              <RefreshCw
                className={cn("size-4", isReconnecting && "animate-spin")}
              />
              {isReconnecting ? "Redirecting..." : "Reconnect"}
            </Button>
            <Button
              variant="destructive"
              onClick={onDisconnect}
              disabled={isReconnecting || isDisconnecting}
              className="gap-2"
            >
              <Unplug className="size-4" />
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      {metrics && (
        <div className="grid gap-px border-b border-border-subtle bg-border-subtle sm:grid-cols-3">
          <MetricStat
            label="Followers"
            value={formatMetricCount(metrics.followers_count)}
          />
          <MetricStat
            label="Following"
            value={formatMetricCount(metrics.follows_count)}
          />
          <MetricStat
            label="Posts"
            value={formatMetricCount(metrics.media_count)}
          />
        </div>
      )}

      <div className="grid gap-px bg-border-subtle sm:grid-cols-3">
        <MetaCell
          label="Connected"
          value={
            account.connected_at
              ? format(new Date(account.connected_at), "MMM d, yyyy")
              : "—"
          }
        />
        <MetaCell label="Access token" value={expiry.label} tone={expiry.tone} />
        <MetaCell
          label="Facebook Page ID"
          value={account.page_id ?? "—"}
          mono
        />
      </div>

      <div className="flex items-start gap-3 border-t border-border-subtle px-6 py-4 text-caption">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-status-approved" />
        <p>
          Stats are fetched live from Meta. Reconnect if you change Facebook
          Pages or Meta revokes access.
        </p>
      </div>
    </div>
  );
}

function MetricStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-surface px-6 py-4 text-center sm:text-left">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-text-primary">
        {value}
      </p>
    </div>
  );
}

function MetaCell({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "danger" | "muted";
  mono?: boolean;
}) {
  return (
    <div className="bg-bg-surface px-6 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-sm text-text-primary",
          mono && "font-mono text-[13px]",
          tone === "warn" && "text-status-pending",
          tone === "danger" && "text-status-rejected",
          tone === "ok" && "text-status-approved",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DisconnectedState({
  onConnect,
  isConnecting,
}: {
  onConnect: () => void;
  isConnecting: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        <div className="relative px-6 py-10 sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 0%, rgba(225,48,108,0.14), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-lg text-center">
            <div
              className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl text-white"
              style={{
                background:
                  "linear-gradient(135deg, #f58529 0%, #dd2a7b 45%, #8134af 75%, #515bd4 100%)",
              }}
            >
              <Camera className="size-7" />
            </div>
            <h2 className="text-xl font-medium text-text-primary">
              Connect Instagram Account
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Link an Instagram Professional account that&apos;s already
              connected to a Facebook Page. You&apos;ll approve access on Meta —
              we never see your password.
            </p>

            <Button
              onClick={onConnect}
              disabled={isConnecting}
              className="mt-8 gap-2 px-6"
              size="lg"
            >
              <Camera className="size-4" />
              {isConnecting ? "Opening Meta..." : "Connect Instagram"}
            </Button>
            <p className="mt-3 text-caption">
              Review the setup guide below if Meta says no Pages were found.
            </p>
          </div>
        </div>
      </div>

      <InstagramSetupGuide defaultOpen />
    </div>
  );
}

function ConnectionSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex items-center gap-4 px-6 py-5">
        <Skeleton className="size-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid gap-px border-t border-border-subtle bg-border-subtle sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-surface px-6 py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InstagramConnectionPanel({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const queryClient = useQueryClient();
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const connectMutation = useConnectInstagram(workspaceId, {
    type: "settings",
    workspaceId,
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["instagram", workspaceId],
    queryFn: () => api.instagram.getConnection(workspaceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.instagram.disconnect(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Instagram disconnected");
      setDisconnectOpen(false);
    },
    onError: (e: Error) =>
      toast.error(
        e instanceof ApiError ? e.message : "Failed to disconnect Instagram",
      ),
  });

  if (isLoading) {
    return <ConnectionSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-status-rejected/30 bg-status-rejected/10 px-6 py-8 text-center">
        <p className="text-sm text-status-rejected">
          Couldn&apos;t load Instagram connection status.
        </p>
        <Button
          variant="outline"
          className="mt-4 gap-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          Try again
        </Button>
      </div>
    );
  }

  if (data?.connected && data.account) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-status-approved">
          <CheckCircle2 className="size-4" />
          Ready to publish from this workspace
        </div>
        <ConnectedAccountCard
          account={data.account}
          metrics={data.metrics ?? null}
          onReconnect={() => connectMutation.mutate()}
          isReconnecting={connectMutation.isPending}
          onDisconnect={() => setDisconnectOpen(true)}
          isDisconnecting={disconnectMutation.isPending}
        />
        <InstagramSetupGuide defaultOpen={false} />

        <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disconnect Instagram?</DialogTitle>
              <DialogDescription>
                Publishing will fail until you reconnect. Scheduled posts for
                this workspace won&apos;t go live without an active Instagram
                connection.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDisconnectOpen(false)}
                disabled={disconnectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending
                  ? "Disconnecting..."
                  : "Disconnect"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <DisconnectedState
      onConnect={() => connectMutation.mutate()}
      isConnecting={connectMutation.isPending}
    />
  );
}
