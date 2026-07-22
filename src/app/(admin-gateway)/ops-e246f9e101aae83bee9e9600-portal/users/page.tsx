"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Pagination,
  PORTAL_ROOT,
  StatusPill,
  TableWrap,
  formatDate,
  tdClass,
  thClass,
} from "../_components/admin-ui";
import { adminApi } from "../_lib/admin-api";

const LIMIT = 20;

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ["admin", "users", search, offset],
    queryFn: () =>
      adminApi.users.list({ search: search || undefined, limit: LIMIT, offset }),
  });

  return (
    <AdminPage
      title="Users"
      description="Search accounts and inspect subscription state"
      actions={
        <Input
          className="w-full sm:w-80"
          type="search"
          placeholder="Search by email or name"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      }
    >
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th className={thClass}>User</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Workspaces</th>
                <th className={thClass}>Verified</th>
                <th className={thClass}>Last login</th>
                <th className={thClass}>Created</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((user) => (
                <tr key={user.id} className="hover:bg-bg-surface-hover/50">
                  <td className={tdClass}>
                    <Link
                      href={`${PORTAL_ROOT}/users/${user.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {user.full_name || "Unnamed user"}
                    </Link>
                    <p className="mt-1 text-sm text-text-secondary">{user.email}</p>
                  </td>
                  <td className={tdClass}>
                    <StatusPill value={user.status} />
                  </td>
                  <td className={tdClass}>{user.workspace_count ?? "—"}</td>
                  <td className={tdClass}>{formatDate(user.email_verified_at)}</td>
                  <td className={tdClass}>{formatDate(user.last_login_at)}</td>
                  <td className={tdClass}>{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {!query.data?.items.length ? (
            <p className="text-center text-sm text-text-secondary">
              No users matched this search.
            </p>
          ) : null}
          <Pagination
            offset={offset}
            limit={LIMIT}
            total={query.data?.total ?? 0}
            onChange={setOffset}
          />
        </>
      )}
    </AdminPage>
  );
}
