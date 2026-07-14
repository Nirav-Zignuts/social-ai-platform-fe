"use client";

import { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { KnowledgeDocument } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
};

function DocumentStatusBadge({ status }: { status: string }) {
  const color =
    status === "indexed"
      ? "var(--status-approved)"
      : status === "failed"
        ? "var(--status-rejected)"
        : status === "processing"
          ? "var(--status-pending)"
          : "var(--status-draft)";

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-surface-hover px-2 py-0.5 text-caption text-text-primary">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {status}
    </span>
  );
}

interface KnowledgeUploadProps {
  workspaceId: string;
  showDelete?: boolean;
  pollWhileProcessing?: boolean;
}

export function KnowledgeUpload({
  workspaceId,
  showDelete = false,
  pollWhileProcessing = true,
}: KnowledgeUploadProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents", workspaceId],
    queryFn: () => api.workspaces.listDocuments(workspaceId),
    refetchInterval: (query) => {
      if (!pollWhileProcessing) return false;
      const docs = query.state.data?.documents ?? [];
      const hasProcessing = docs.some(
        (d) => d.status === "uploaded" || d.status === "processing",
      );
      return hasProcessing ? 3000 : false;
    },
  });

  const documents = data?.documents ?? [];

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      api.workspaces.uploadDocument(workspaceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
      toast.success("Document uploaded");
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Upload failed",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      api.workspaces.deleteDocument(workspaceId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
      toast.success("Document deleted");
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Delete failed",
      );
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => uploadMutation.mutate(file));
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 10 * 1024 * 1024,
    disabled: uploadMutation.isPending,
  });

  const hasIndexed = useMemo(
    () => documents.some((d) => d.status === "indexed"),
    [documents],
  );

  const hasProcessing = useMemo(
    () =>
      documents.some(
        (d) => d.status === "uploaded" || d.status === "processing",
      ),
    [documents],
  );

  const failedDocuments = useMemo(
    () => documents.filter((d) => d.status === "failed"),
    [documents],
  );

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed border-border-subtle p-8 text-center transition-colors duration-150",
          isDragActive
            ? "border-accent bg-accent/5"
            : "hover:border-accent/50",
          uploadMutation.isPending && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 size-10 text-text-secondary" />
        <p className="font-medium">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop files, or click to browse"}
        </p>
        <p className="mt-1 text-caption">
          PDF, DOCX, or TXT up to 10MB
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">Failed to load documents</p>
      )}

      {documents.length === 0 && !isLoading && (
        <p className="text-center text-sm text-muted-foreground">
          No documents uploaded yet
        </p>
      )}

      <ul className="space-y-2">
        {documents.map((doc: KnowledgeDocument) => (
          <li
            key={doc.id}
            className="rounded-lg border p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.file_type.toUpperCase()}
                    {doc.file_size_bytes
                      ? ` · ${(doc.file_size_bytes / 1024).toFixed(1)} KB`
                      : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DocumentStatusBadge status={doc.status} />
                {showDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {doc.status === "failed" && doc.error_message && (
              <p className="mt-2 text-sm text-destructive">{doc.error_message}</p>
            )}
          </li>
        ))}
      </ul>

      {hasProcessing && (
        <p className="text-sm text-amber-600">
          Waiting for at least one document to finish indexing...
        </p>
      )}

      {!hasIndexed && !hasProcessing && failedDocuments.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
          <p className="text-sm font-medium text-destructive">
            {failedDocuments.length === 1
              ? "Document failed to index"
              : `${failedDocuments.length} documents failed to index`}
          </p>
          {failedDocuments.map((doc) =>
            doc.error_message ? (
              <p key={doc.id} className="text-sm text-destructive/90">
                <span className="font-medium">{doc.file_name}:</span>{" "}
                {doc.error_message}
              </p>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

export function useHasIndexedDocuments(workspaceId: string) {
  const { data } = useQuery({
    queryKey: ["documents", workspaceId],
    queryFn: () => api.workspaces.listDocuments(workspaceId),
  });
  return (data?.documents ?? []).some((d) => d.status === "indexed");
}
