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
  humanize,
  tdClass,
  thClass,
} from "../_components/admin-ui";
import { adminApi } from "../_lib/admin-api";

const LIMIT = 50;

export default function AdminActionLogsPage() {
  const [actionType, setActionType] = useState("");
  const [targetType, setTargetType] = useState("");
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["admin", "action-logs", actionType, targetType, offset],
    queryFn: () =>
      adminApi.actionLogs.list({
        action_type: actionType || undefined,
        target_type: targetType || undefined,
        limit: LIMIT,
        offset,
      }),
  });

  return (
    <AdminPage
      title="Action logs"
      description="Immutable audit trail of privileged operations"
    >
      <div className="grid gap-3 rounded-xl border border-border-subtle bg-bg-surface p-4 sm:grid-cols-2">
        <Input
          placeholder="Filter action type"
          value={actionType}
          onChange={(event) => {
            setActionType(event.target.value);
            setOffset(0);
          }}
        />
        <Input
          placeholder="Filter target type"
          value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value);
            setOffset(0);
          }}
        />
      </div>
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : (
        <>
          <TableWrap>
            <thead><tr>
              <th className={thClass}>Time</th><th className={thClass}>Action</th>
              <th className={thClass}>Target</th><th className={thClass}>Admin</th>
              <th className={thClass}>Reason</th><th className={thClass}>Snapshot</th>
            </tr></thead>
            <tbody>
              {query.data?.items.map((log) => (
                <tr key={log.id}>
                  <td className={tdClass}>{formatDate(log.created_at)}</td>
                  <td className={tdClass}>{humanize(log.action_type)}</td>
                  <td className={tdClass}>
                    <p>{humanize(log.target_type)}</p>
                    <p className="text-xs text-text-secondary">{log.target_id}</p>
                  </td>
                  <td className={`${tdClass} text-xs`}>{log.admin_id}</td>
                  <td className={`${tdClass} max-w-80 whitespace-pre-wrap`}>{log.reason}</td>
                  <td className={`${tdClass} max-w-96`}>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">
                      {JSON.stringify(log.payload_snapshot, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination offset={offset} limit={LIMIT} total={query.data?.total ?? 0} onChange={setOffset} />
        </>
      )}
    </AdminPage>
  );
}
