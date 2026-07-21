"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Pagination,
  StatusPill,
  formatDate,
  humanize,
} from "../_components/admin-ui";
import {
  AdminApiError,
  adminApi,
  type ContactEnquiry,
} from "../_lib/admin-api";

const LIMIT = 20;
const statuses = ["new", "in_progress", "resolved", "spam"];

export default function ContactEnquiriesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactEnquiry | null>(null);
  const query = useQuery({
    queryKey: ["admin", "enquiries", statusFilter, typeFilter, offset],
    queryFn: () =>
      adminApi.enquiries.list({
        status: statusFilter || undefined,
        enquiry_type: typeFilter || undefined,
        sort_order: "desc",
        limit: LIMIT,
        offset,
      }),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "enquiries"] });
  const update = useMutation({
    mutationFn: ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: string;
      admin_notes: string;
    }) => adminApi.enquiries.update(id, { status, admin_notes }),
    onSuccess: async () => {
      await refresh();
      toast.success("Enquiry updated");
    },
    onError: notifyError,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.enquiries.delete(id),
    onSuccess: async () => {
      setDeleteTarget(null);
      setExpandedId(null);
      await refresh();
      toast.success("Enquiry deleted");
    },
    onError: notifyError,
  });

  return (
    <AdminPage
      title="Contact enquiries"
      description="Triage sales and support messages"
      actions={
        <div className="flex gap-2">
          <FilterSelect
            value={statusFilter}
            label="All statuses"
            options={statuses}
            onChange={(value) => { setStatusFilter(value); setOffset(0); }}
          />
          <FilterSelect
            value={typeFilter}
            label="All types"
            options={["sales", "support"]}
            onChange={(value) => { setTypeFilter(value); setOffset(0); }}
          />
        </div>
      }
    >
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState retry={() => void query.refetch()} />
      ) : (
        <>
          <div className="space-y-3">
            {query.data?.items.map((enquiry) => (
              <EnquiryCard
                key={`${enquiry.id}-${enquiry.updated_at}`}
                enquiry={enquiry}
                expanded={expandedId === enquiry.id}
                pending={update.isPending && update.variables?.id === enquiry.id}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === enquiry.id ? null : enquiry.id,
                  )
                }
                onSave={(status, notes) =>
                  update.mutate({
                    id: enquiry.id,
                    status,
                    admin_notes: notes,
                  })
                }
                onDelete={() => setDeleteTarget(enquiry)}
              />
            ))}
            {!query.data?.items.length ? (
              <p className="py-12 text-center text-sm text-text-secondary">
                No enquiries match these filters.
              </p>
            ) : null}
          </div>
          <Pagination offset={offset} limit={LIMIT} total={query.data?.total ?? 0} onChange={setOffset} />
        </>
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete enquiry?</DialogTitle>
            <DialogDescription>
              This permanently removes the enquiry from {deleteTarget?.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}
            >
              {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function EnquiryCard({
  enquiry,
  expanded,
  pending,
  onToggle,
  onSave,
  onDelete,
}: {
  enquiry: ContactEnquiry;
  expanded: boolean;
  pending: boolean;
  onToggle: () => void;
  onSave: (status: string, notes: string) => void;
  onDelete: () => void;
}) {
  const [status, setStatus] = useState(enquiry.status);
  const [notes, setNotes] = useState(enquiry.admin_notes ?? "");

  return (
    <article className="rounded-xl border border-border-subtle bg-bg-surface">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
        onClick={onToggle}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{enquiry.name}</span>
            <StatusPill value={enquiry.status} />
            <span className="rounded-full bg-bg-surface-hover px-2 py-1 text-xs text-text-secondary">
              {humanize(enquiry.enquiry_type)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-text-secondary">
            {enquiry.email} · {formatDate(enquiry.created_at)}
          </p>
          <p className="mt-2 line-clamp-1 text-sm">{enquiry.message}</p>
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      {expanded ? (
        <div className="space-y-5 border-t border-border-subtle p-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Company">{enquiry.company_name ?? "—"}</Field>
            <Field label="Plan interest">{enquiry.plan_interest ?? "—"}</Field>
            <Field label="User ID">{enquiry.user_id ?? "—"}</Field>
            <Field label="Handled by">{enquiry.handled_by ?? "—"}</Field>
          </dl>
          <div>
            <p className="text-xs text-text-secondary">Message</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{enquiry.message}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
            <label className="space-y-2 text-sm">
              <span>Status</span>
              <select
                className="h-9 w-full rounded-lg border border-border-subtle bg-bg-base px-3"
                value={status}
                onChange={(event) => setStatus(event.target.value as ContactEnquiry["status"])}
              >
                {statuses.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span>Admin notes</span>
              <Textarea
                maxLength={10000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Internal notes"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="destructive" onClick={onDelete}>Delete</Button>
            <Button disabled={pending} onClick={() => onSave(status, notes)}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function FilterSelect({ value, label, options, onChange }: { value: string; label: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select className="h-9 rounded-lg border border-border-subtle bg-bg-base px-3" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 break-words">{children}</dd></div>;
}

function notifyError(error: Error) {
  toast.error(error instanceof AdminApiError ? error.message : "Enquiry action failed");
}
