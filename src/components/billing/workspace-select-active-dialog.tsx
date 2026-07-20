"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import {
  isWorkspaceActive,
  isWorkspaceLocked,
  listSelectableWorkspaces,
} from "@/lib/billing";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface WorkspaceSelectActiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Max workspaces the user may keep active (Free = 2). */
  limit: number;
}

export function WorkspaceSelectActiveDialog({
  open,
  onOpenChange,
  limit,
}: WorkspaceSelectActiveDialogProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.workspaces.list(),
    enabled: open,
    staleTime: 15_000,
  });

  const workspaces = useMemo(
    () => listSelectableWorkspaces(data?.workspaces ?? []),
    [data?.workspaces],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || workspaces.length === 0) return;
    const activeIds = workspaces
      .filter((w) => isWorkspaceActive(w))
      .slice(0, limit)
      .map((w) => w.id);
    setSelectedIds(
      activeIds.length > 0
        ? activeIds
        : workspaces.slice(0, Math.min(limit, workspaces.length)).map((w) => w.id),
    );
  }, [open, workspaces, limit]);

  const mutation = useMutation({
    mutationFn: (ids: string[]) => api.billing.selectActiveWorkspaces(ids),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "status"] }),
      ]);
      toast.success("Active workspaces updated");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Couldn’t update active workspaces",
      );
    },
  });

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= limit) {
        toast.message(`You can keep up to ${limit} workspaces on Free`);
        return current;
      }
      return [...current, id];
    });
  };

  const canSubmit =
    selectedIds.length >= 1 &&
    selectedIds.length <= limit &&
    !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose workspaces to keep</DialogTitle>
          <DialogDescription>
            Free includes up to {limit} active workspace
            {limit === 1 ? "" : "s"}. Pick which ones stay active — the rest
            stay locked until you upgrade or change this selection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-caption">
          <span>
            Selected {selectedIds.length} / {limit}
          </span>
          <span className="inline-flex items-center gap-1 text-accent">
            <Sparkles className="size-3" />
            Need more? Upgrade to Pro
          </span>
        </div>

        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-text-secondary">
              Loading workspaces…
            </p>
          ) : workspaces.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">
              No workspaces found.
            </p>
          ) : (
            workspaces.map((workspace) => {
              const checked = selectedIds.includes(workspace.id);
              const locked = isWorkspaceLocked(workspace);
              return (
                <label
                  key={workspace.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                    checked
                      ? "border-accent/50 bg-accent/10"
                      : "border-border-subtle bg-bg-surface hover:bg-bg-surface-hover",
                    locked && !checked && "opacity-80",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-accent"
                    checked={checked}
                    onChange={() => toggle(workspace.id)}
                    disabled={mutation.isPending}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {workspace.name}
                      </span>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-bg-base px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                          <Lock className="size-2.5" />
                          Locked
                        </span>
                      ) : (
                        <span className="rounded-full bg-status-approved/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-status-approved">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-caption">
                      {locked
                        ? "Over plan limit. Select this workspace or upgrade to unlock."
                        : "Active — included in your Free plan"}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Later
          </Button>
          <Button
            onClick={() => mutation.mutate(selectedIds)}
            disabled={!canSubmit}
          >
            {mutation.isPending ? "Saving…" : "Keep selected active"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
