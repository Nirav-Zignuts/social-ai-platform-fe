"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  AdminPage,
  ErrorState,
  LoadingState,
  PORTAL_ROOT,
  StatusPill,
  TableWrap,
  formatDate,
  tdClass,
  thClass,
} from "../../../_components/admin-ui";
import { adminApi } from "../../../_lib/admin-api";

export default function GenerationRunsPage() {
  const { workspace_id: workspaceId } = useParams<{ workspace_id: string }>();
  const query = useQuery({
    queryKey: ["admin", "workspace", workspaceId, "generation-runs"],
    queryFn: () => adminApi.workspaces.generationRuns(workspaceId, 100),
    enabled: Boolean(workspaceId),
  });

  return (
    <AdminPage
      title="Generation runs"
      description={`Latest generated posts for workspace ${workspaceId}`}
      actions={
        <Button
          variant="outline"
          render={<Link href={`${PORTAL_ROOT}/workspaces/${workspaceId}`} />}
        >
          Back to workspace
        </Button>
      }
    >
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <th className={thClass}>Cycle / post</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Reviewer</th>
              <th className={thClass}>Regenerations</th>
              <th className={thClass}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.items.map((run) => (
              <tr key={`${run.generation_cycle_id}-${run.post_id}`}>
                <td className={tdClass}>
                  <p className="text-xs">{run.generation_cycle_id}</p>
                  <p className="text-xs text-text-secondary">{run.post_id}</p>
                </td>
                <td className={tdClass}><StatusPill value={run.status} /></td>
                <td className={`${tdClass} max-w-96`}>
                  <p>{run.reviewer_score ?? "—"}</p>
                  <p className="line-clamp-3 text-xs text-text-secondary">
                    {run.reviewer_notes ?? "No reviewer notes"}
                  </p>
                </td>
                <td className={tdClass}>{run.regenerate_count}</td>
                <td className={tdClass}>{formatDate(run.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </AdminPage>
  );
}
